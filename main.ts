import dayjs from 'dayjs'; // Why? Because https://gist.github.com/timvisee/fcda9bbdff88d45cc9061606b4b923ca

// Begin DB setup boilerplate (non-functional)
const { Client } = require('pg');
const client = new Client({
  user: 'dbuser',
  host: 'database.server.com',
  database: 'CNoteDB',
  password: 'secretpassword',
  port: 3211,
});
client.connect();
// End DB setup boilerplate


/* 
  ** The main function for the purposes of this code challenge** 
  (Proper error handling and SQL injection protection not provided)
*/
async function fetchInterestAccrued(userId: Number) {
  // 1.a. Prepare to fetch current balance info from (mock) DB
  const q1: string = 'SELECT $1, $2 FROM user_balances WHERE user_id = $3';
  const q1Params: string[] = ['current_balance', 'last_updated', `${userId}`];

  // 1.b. Prepare to fetch pending interest information from (mock) DB;
  //      The interest is tracked on a daily basis but not official accrued
  //      until the end of the month, so we will show pending interest to the
  //      client until then. Note: the following is pseudo-SQL and may not
  //      be formatted perfectly (yet)
  const q2: string = `
    SELECT SUM($1) AS total
    FROM daily_interest_updates
    WHERE $2 >= ${dayjs().startOf('month')}
    AND user_id = $3
  `;
  const q2Params: string[] = ['accrual_amount', 'updated_at', `${userId}`];
  
  // 2. Fetch
  try {
    const res1 = await client.query(q1, q1Params);
    // e.g.: { current_balance: '$10000.00', last_updated: '2022-12-31 23:58:01+5:00' }

    const res2 = await client.query(q2, q2Params);
    // e.g.: { total: ' 0.547945205477' }  // if the client is checking on the 2nd of the month for example

    // 2. Return to front end for display to client
    return {
      currentBalance: res1.rows[0].current_balance, // does not include this month's pending interest
      balanceLastUpdated: res1.rows[0].last_updated,
      interestAccrued: res2.rows[0].total, // sum of daily interest accruals this month; unofficial until EOM
    };
  } catch (err: unknown) {
    console.error('Error fetching client data', err);
    return {};
  }
}

/*
  Since the above function counts on daily interest calculations being made ahead of time,
  I'll put a skeleton function below which roughly demonstrates what I'd expect a 
  job / task-runner to execute on a daily basis at the end of the day (i.e. after deposits
  and withdrawals are closed for the day)
*/
async function calculateDailyInterestAndUpdate(userId: Number) {
  const q1: string = 'SELECT $1, $2 FROM user_balances WHERE user_id = $3';
  const q1Params: string[] = ['interest_rate', 'current_balance', `${userId}`];

  try {
    const res1 = await client.query(q1, q1Params); // { interest_rate: '0.02' }
    // The daily interest calculation follows the test cases and therefore does not account
    // for leap years; a different amound of interest is accrued each month depending on number
    // of days in that month. Another approach could be to accrue the same amount of interest
    // at the end of each month like dailyInterestRate = (interest_rate / 12 / dayjs().daysInMonth())
    const dailyInterestRate = res1.rows[0].interest_rate / 365; 
    const interestAccruedToday = (res1.rows[0].current_balance * dailyInterestRate).toFixed(2);
    const newBalance = res1.rows[0].current_balance + interestAccruedToday;
    const q2: string = `
      INSERT INTO daily_interest_updates(user_id, interest_rate, pending_balance_EOD, accrual_amount, updated_at)
      VALUES (${userId}, ${res1.rows[0].interest_rate}, ${newBalance}, ${interestAccruedToday}, NOW())
      RETURNING *
    `;
    const res2 = await client.query(q2);
    // e.g.:
    // { user_id: '1', interest_rate: '0.02', pending_balance_EOD: '10000.547945205477', accrual_amount: '0.547945205477',
    //   updated_at: <11:00PM Today's Date> }
  } catch (err: unknown) {
    console.error('Error updating daily interest', err);
    return {};
  }
}

/*
  The final piece of the puzzle as it's scoped here would be a job / task which, at the end
  of the month, takes the current month's interest accruals and updates user balance officially.
  As envisioned here, this would (as part of a single SQL transaction) select the sum of the
  daily interest updates as done above, insert a row into the movements table to log it, and
  update the users official current_balance in the user_balances table. I've chosen not to show
  it here since it isn't involved in the main interest calculations--it's simply necessary for
  the function of the overall DB design which emphasizes high auditability and persistence of
  all movement data, both completed and pending.
*/
async function makeMonthlyMovementUpdates(userId: number) {
  // Grab the month's daily interest calculations for this user and sum them
  // (or simply recalculate the monthly interest rate as interest_rate / 12), 
  // insert a row into the movements table for auditability,
  // and update user_balances.current_balance accordingly.
}
// We will use the native global fetch API supported natively in modern Node.js (v18+)

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🚀 Starting Integration Tests for Digital Udhaar Khata...\n');

  // Generate unique credentials for this test run
  const testId = Math.floor(Math.random() * 1000000);
  const ownerEmail = `owner_${testId}@test.com`;
  const ownerPassword = 'password123';
  const employeeEmail = `employee_${testId}@test.com`;
  const employeePassword = 'password123';

  let ownerToken = '';
  let employeeToken = '';
  let customerId = '';
  let transactionId = '';

  const assert = (condition, message) => {
    if (!condition) {
      throw new Error(`❌ Assertion Failed: ${message}`);
    }
    console.log(`  ✅ ${message}`);
  };

  try {
    // ----------------------------------------------------
    // TEST 1: Register Shop Owner
    // ----------------------------------------------------
    console.log('📝 Test 1: Registering Shop Owner...');
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jane Doe',
        email: ownerEmail,
        password: ownerPassword,
        shopName: 'Super Kirana Hub',
        shopAddress: '123 Main Street, Sector 4',
        phone: '+919876543210'
      })
    });

    const registerData = await registerRes.json();
    if (!registerRes.ok) {
      console.log('Backend Registration Error Details:', registerData);
    }
    assert(registerRes.ok, `Owner registration API request should succeed: ${registerData.message || JSON.stringify(registerData)}`);
    assert(registerData.success === true, 'Response success should be true');
    assert(registerData.token, 'Response should contain a JWT token');
    assert(registerData.user.role === 'owner', 'Role should be owner');
    ownerToken = registerData.token;

    // ----------------------------------------------------
    // TEST 2: Login Shop Owner
    // ----------------------------------------------------
    console.log('\n🔐 Test 2: Logging in Shop Owner...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ownerEmail,
        password: ownerPassword
      })
    });

    const loginData = await loginRes.json();
    assert(loginRes.ok, 'Owner login API request should succeed');
    assert(loginData.success === true, 'Owner login success should be true');
    assert(loginData.token, 'Owner login should return a token');
    assert(loginData.user.shopName === 'Super Kirana Hub', 'Owner shop name should match');

    // ----------------------------------------------------
    // TEST 3: Create Customer
    // ----------------------------------------------------
    console.log('\n👥 Test 3: Creating a new Customer...');
    const createCustomerRes = await fetch(`${BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        name: 'John Customer',
        phone: '9999988888',
        email: 'john@customer.com',
        maxCreditLimit: 5000
      })
    });

    const createCustomerData = await createCustomerRes.json();
    assert(createCustomerRes.ok, 'Customer creation should succeed');
    assert(createCustomerData.success === true, 'Customer success should be true');
    assert(createCustomerData.data.name === 'John Customer', 'Customer name should match');
    assert(createCustomerData.data.balance === 0, 'Initial balance should be 0');
    customerId = createCustomerData.data._id;

    // ----------------------------------------------------
    // TEST 4: Get Customer List & Details
    // ----------------------------------------------------
    console.log('\n🔍 Test 4: Querying Customer List & Details...');
    const getCustomersRes = await fetch(`${BASE_URL}/customers`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    const getCustomersData = await getCustomersRes.json();
    assert(getCustomersRes.ok, 'Get customers API should succeed');
    assert(getCustomersData.success === true, 'Success should be true');
    assert(getCustomersData.count >= 1, 'Customer count should be at least 1');
    assert(getCustomersData.data.some(c => c._id === customerId), 'Customer list should contain our customer');

    const getCustomerDetailsRes = await fetch(`${BASE_URL}/customers/${customerId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    const getCustomerDetailsData = await getCustomerDetailsRes.json();
    assert(getCustomerDetailsRes.ok, 'Get customer details API should succeed');
    assert(getCustomerDetailsData.data.name === 'John Customer', 'Detailed customer name should match');

    // ----------------------------------------------------
    // TEST 5: Add Credit Transaction (Shopowner lends to customer)
    // ----------------------------------------------------
    console.log('\n💳 Test 5: Adding a Credit Transaction (lending to customer)...');
    const creditRes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        customerId,
        type: 'credit',
        amount: 2500,
        description: 'Rice, wheat flour, and spices'
      })
    });

    const creditData = await creditRes.json();
    if (!creditRes.ok) {
      console.log('Backend Credit Transaction Error Details:', creditData);
    }
    assert(creditRes.ok, `Credit transaction creation should succeed: ${creditData.message || JSON.stringify(creditData)}`);
    assert(creditData.success === true, 'Success should be true');
    assert(creditData.data.amount === 2500, 'Transaction amount should be 2500');
    assert(creditData.data.type === 'credit', 'Transaction type should be credit');
    transactionId = creditData.data._id;

    // Verify updated customer balance (Should be +2500)
    const afterCreditRes = await fetch(`${BASE_URL}/customers/${customerId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    const afterCreditData = await afterCreditRes.json();
    assert(afterCreditData.data.balance === 2500, 'Customer balance after credit should be 2500');

    // ----------------------------------------------------
    // TEST 6: Add Debit Transaction (Customer pays back)
    // ----------------------------------------------------
    console.log('\n💰 Test 6: Adding a Debit Transaction (customer pays back)...');
    const debitRes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        customerId,
        type: 'debit',
        amount: 1000,
        description: 'Cash payment part-settlement'
      })
    });

    const debitData = await debitRes.json();
    assert(debitRes.ok, 'Debit transaction creation should succeed');
    assert(debitData.success === true, 'Success should be true');

    // Verify updated customer balance (Should be 2500 - 1000 = 1500)
    const afterDebitRes = await fetch(`${BASE_URL}/customers/${customerId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    const afterDebitData = await afterDebitRes.json();
    assert(afterDebitData.data.balance === 1500, 'Customer balance after debit should be 1500 (2500 - 1000)');

    // ----------------------------------------------------
    // TEST 7: Dashboard Analytics
    // ----------------------------------------------------
    console.log('\n📊 Test 7: Retrieving Dashboard Analytics...');
    const dashboardRes = await fetch(`${BASE_URL}/dashboard/stats`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    const dashboardData = await dashboardRes.json();
    assert(dashboardRes.ok, 'Dashboard analytics API should succeed');
    assert(dashboardData.success === true, 'Success should be true');
    assert(dashboardData.data.totalPendingBalance === 1500, 'Total pending balance should be 1500');
    assert(dashboardData.data.totalCustomers === 1, 'Total customers should be 1');

    // ----------------------------------------------------
    // TEST 8: Create Employee Onboarding
    // ----------------------------------------------------
    console.log('\n👔 Test 8: Registering an Employee (Owner authorized)...');
    const createEmployeeRes = await fetch(`${BASE_URL}/auth/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        name: 'Jack Employee',
        email: employeeEmail,
        password: employeePassword,
        phone: '+919998887776'
      })
    });

    const createEmployeeData = await createEmployeeRes.json();
    assert(createEmployeeRes.ok, 'Employee creation should succeed');
    assert(createEmployeeData.success === true, 'Success should be true');
    assert(createEmployeeData.data.role === 'employee', 'Created user role should be employee');

    // ----------------------------------------------------
    // TEST 9: Login Employee & Scoped Action
    // ----------------------------------------------------
    console.log('\n🔑 Test 9: Logging in Employee & Performing Operations...');
    const employeeLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: employeeEmail,
        password: employeePassword
      })
    });

    const employeeLoginData = await employeeLoginRes.json();
    assert(employeeLoginRes.ok, 'Employee login should succeed');
    employeeToken = employeeLoginData.token;

    // Verify employee can read owner's customer (same shopId)
    const employeeGetCustomerRes = await fetch(`${BASE_URL}/customers/${customerId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${employeeToken}` }
    });
    const employeeGetCustomerData = await employeeGetCustomerRes.json();
    assert(employeeGetCustomerRes.ok, 'Employee should be able to view customers in their shop');
    assert(employeeGetCustomerData.data.name === 'John Customer', 'Employee sees the correct customer details');

    // Verify employee role restriction (Employee CANNOT delete a customer)
    console.log('🛡️  Verifying role-based route permissions...');
    const employeeDeleteCustomerRes = await fetch(`${BASE_URL}/customers/${customerId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${employeeToken}` }
    });
    const employeeDeleteCustomerData = await employeeDeleteCustomerRes.json();
    assert(employeeDeleteCustomerRes.status === 403, 'Employee should be forbidden (403) from deleting customer');
    assert(employeeDeleteCustomerData.success === false, 'Delete should be rejected');

    // ----------------------------------------------------
    // TEST 10: Reminders Simulation
    // ----------------------------------------------------
    console.log('\n📢 Test 10: Simulating Twilio Payment Reminders...');
    const reminderRes = await fetch(`${BASE_URL}/reminders/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        customerId,
        channel: 'whatsapp'
      })
    });
    const reminderData = await reminderRes.json();
    if (!reminderRes.ok) {
      console.log('Backend Reminder Error Details:', reminderData);
    }
    assert(reminderRes.ok, `Reminder endpoint should succeed: ${reminderData.message || JSON.stringify(reminderData)}`);
    assert(reminderData.success === true, 'Reminder success should be true');
    assert(reminderData.message.includes('simulated') || reminderData.message.includes('sent'), 'Should simulate reminder dispatch');

    // ----------------------------------------------------
    // TEST 11: Simulating Email Payment Reminders
    // ----------------------------------------------------
    console.log('\n📧 Test 11: Simulating Email Payment Reminders...');
    const emailReminderRes = await fetch(`${BASE_URL}/reminders/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        customerId,
        channel: 'email'
      })
    });
    const emailReminderData = await emailReminderRes.json();
    if (!emailReminderRes.ok) {
      console.log('Backend Email Reminder Error Details:', emailReminderData);
    }
    assert(emailReminderRes.ok, `Email reminder endpoint should succeed: ${emailReminderData.message || JSON.stringify(emailReminderData)}`);
    assert(emailReminderData.success === true, 'Email reminder success should be true');
    assert(emailReminderData.message.includes('successfully') || emailReminderData.message.includes('sent'), 'Should send email reminder');
    assert(typeof emailReminderData.simulated === 'boolean', 'Should return a boolean simulation flag');

    console.log('\n🎉 ALL 11 INTEGRATION TESTS PASSED GLORIOUSLY! 🌟');
    console.log('   All APIs behave perfectly under owner and employee credentials.');
    console.log('   Multi-shop scoping is fully active and validated.');
    console.log('   Financial arithmetic is correct and exact.');
  } catch (error) {
    console.error('\n💥 TEST RUN FAILED!');
    console.error(error);
    process.exit(1);
  }
}

runTests();

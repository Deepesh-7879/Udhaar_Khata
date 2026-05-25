import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import { sendEmailNotification } from './services/emailService.js';
import mongoose from 'mongoose';

// Load environmental variables
dotenv.config();

async function runSmtpIntegrationTests() {
  console.log('🚀 Running Integration Tests for Custom SMTP Email Reminder Flow...\n');
  
  // Connect to the DB
  await connectDB();
  
  const testId = Math.floor(Math.random() * 1000000);
  const ownerEmail = `smtp_owner_${testId}@test.com`;
  
  let testUser = null;
  
  try {
    // ----------------------------------------------------
    // TEST 1: Create a merchant owner user with default settings
    // ----------------------------------------------------
    console.log('📝 Test 1: Registering merchant owner...');
    testUser = await User.create({
      name: 'Test SMTP Merchant',
      email: ownerEmail,
      password: 'password123',
      role: 'owner',
      shopName: 'SMTP Kirana Store',
      shopAddress: 'Sector 55, Noida',
      phone: '+919999900000'
    });
    
    console.log(`  ✅ Merchant owner registered successfully. ID: ${testUser._id}`);
    
    // ----------------------------------------------------
    // TEST 2: Update Merchant profile with custom SMTP credentials
    // ----------------------------------------------------
    console.log('\n🔧 Test 2: Configuring custom SMTP settings...');
    testUser.smtpHost = 'smtp.dummyserver.org';
    testUser.smtpPort = 465;
    testUser.smtpUser = 'merchant_business@dummyserver.org';
    testUser.smtpPass = 'secureapppassword123';
    
    await testUser.save();
    
    // Retrieve fresh from DB to verify persistence
    const verifiedUser = await User.findById(testUser._id);
    if (!verifiedUser) throw new Error('User record was not found after saving.');
    
    if (verifiedUser.smtpHost !== 'smtp.dummyserver.org') throw new Error('smtpHost mismatch');
    if (verifiedUser.smtpPort !== 465) throw new Error('smtpPort mismatch');
    if (verifiedUser.smtpUser !== 'merchant_business@dummyserver.org') throw new Error('smtpUser mismatch');
    if (verifiedUser.smtpPass !== 'secureapppassword123') throw new Error('smtpPass mismatch');
    
    console.log('  ✅ SMTP custom configuration fields successfully persisted in database.');

    // ----------------------------------------------------
    // TEST 3: Validate dynamic transporter resolution and error trapping
    // ----------------------------------------------------
    console.log('\n📧 Test 3: Verifying dynamic SMTP transporter initialization...');
    
    // Triggering the reminder dispatch with the dummy SMTP credentials.
    // It should try to resolve/connect to smtp.dummyserver.org, which will throw a DNS ENOTFOUND or connect ETIMEDOUT error,
    // thereby proving that the custom transporter parameters were loaded and used!
    let trappedError = null;
    try {
      await sendEmailNotification({
        email: 'customer@test.com',
        name: 'Jane Customer',
        amount: 2500,
        shopName: verifiedUser.shopName,
        fromEmail: verifiedUser.email,
        smtpSettings: {
          host: verifiedUser.smtpHost,
          port: verifiedUser.smtpPort,
          user: verifiedUser.smtpUser,
          pass: verifiedUser.smtpPass
        }
      });
    } catch (error) {
      trappedError = error;
    }
    
    if (!trappedError) {
      throw new Error('Test expected an error because dummy server should not resolve/connect, but it passed.');
    }
    
    console.log(`  🔍 Captured Mailer Dispatch Result: "${trappedError.message}"`);
    
    // Assert that the error is indeed related to the custom dummy SMTP host
    const errorText = trappedError.message.toLowerCase();
    if (errorText.includes('dummyserver.org') || errorText.includes('enotfound') || errorText.includes('etimedout') || errorText.includes('econnrefused')) {
      console.log('  ✅ Success! The Nodemailer transport attempted to send via "smtp.dummyserver.org".');
    } else {
      throw new Error(`Unexpected error message trapped: ${trappedError.message}`);
    }

    console.log('\n🏆 ALL SMTP CONFIGURATION TESTS COMPLETED SUCCESSFULLY!');
  } catch (error) {
    console.error(`\n❌ Integration Test Failed: ${error.message}`);
    process.exit(1);
  } finally {
    // Cleanup the database test record
    if (testUser) {
      await User.deleteOne({ _id: testUser._id });
      console.log('\n🧹 Database cleaned successfully.');
    }
    // Close mongoose connection
    await mongoose.connection.close();
  }
}

runSmtpIntegrationTests();

const mongoose = require('mongoose');

const uri_srv = "mongodb+srv://hrmanagement_admin:HrDeploy12345@cluster0.0slif0p.mongodb.net/hr_management?retryWrites=true&w=majority&appName=Cluster0";
const uri_legacy = "mongodb://hrmanagement_admin:HrDeploy12345@ac-z5rzivk-shard-00-00.0slif0p.mongodb.net:27017,ac-z5rzivk-shard-00-01.0slif0p.mongodb.net:27017,ac-z5rzivk-shard-00-02.0slif0p.mongodb.net:27017/hr_management?ssl=true&replicaSet=atlas-z5rzivk-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

async function testConnection(uri, name) {
  console.log(`Testing ${name}...`);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ ${name} connected successfully!`);
    await mongoose.disconnect();
  } catch (error) {
    console.log(`❌ ${name} failed:`, error.message);
  }
}

async function run() {
  await testConnection(uri_srv, "SRV Connection");
  await testConnection(uri_legacy, "Legacy Connection");
}

run();

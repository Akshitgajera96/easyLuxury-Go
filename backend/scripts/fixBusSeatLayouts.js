/**
 * Migration script to fix bus seat layouts
 * Run this script to regenerate seat layouts for all buses that have invalid or old-format layouts
 * 
 * Usage: node backend/scripts/fixBusSeatLayouts.js
 */

const mongoose = require('mongoose');
const Bus = require('../models/busModel');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixBusSeatLayouts = async () => {
  try {
    console.log('\n🔧 Starting bus seat layout migration...\n');

    // Get all buses
    const buses = await Bus.find({});
    console.log(`📊 Found ${buses.length} buses in database\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const bus of buses) {
      console.log(`\n🚌 Processing Bus: ${bus.busNumber} (${bus.busName})`);
      
      // Check if bus has a valid new-format layout
      const hasValidNewLayout = bus.seatLayout && 
        bus.seatLayout.left && bus.seatLayout.right && 
        bus.seatLayout.totalRows > 0 &&
        (bus.seatLayout.left.upper?.length > 0 || bus.seatLayout.left.lower?.length > 0 ||
         bus.seatLayout.right.upper?.length > 0 || bus.seatLayout.right.lower?.length > 0);

      if (hasValidNewLayout) {
        console.log(`  ✅ Already has valid seat layout - Skipping`);
        console.log(`     Left: ${bus.seatLayout.left.upper?.length || 0} upper, ${bus.seatLayout.left.lower?.length || 0} lower`);
        console.log(`     Right: ${bus.seatLayout.right.upper?.length || 0} upper, ${bus.seatLayout.right.lower?.length || 0} lower`);
        skippedCount++;
        continue;
      }

      // Check if it has old format
      const hasOldFormat = bus.seatLayout?.lowerDeck?.seats?.length > 0 || bus.seatLayout?.upperDeck?.seats?.length > 0;
      
      if (hasOldFormat) {
        console.log(`  🔄 Old format detected - Converting to new format`);
        console.log(`     Old layout: ${bus.seatLayout.lowerDeck?.seats?.length || 0} lower deck, ${bus.seatLayout.upperDeck?.seats?.length || 0} upper deck`);
      } else if (!bus.seatLayout || Object.keys(bus.seatLayout).length === 0) {
        console.log(`  ⚠️  No seat layout found - Generating new layout`);
      } else {
        console.log(`  ⚠️  Invalid seat layout detected - Regenerating`);
      }

      // Regenerate seat layout
      bus.generateSeatLayout();
      await bus.save();

      console.log(`  ✅ Fixed! New layout generated:`);
      console.log(`     Left: ${bus.seatLayout.left.upper?.length || 0} upper, ${bus.seatLayout.left.lower?.length || 0} lower`);
      console.log(`     Right: ${bus.seatLayout.right.upper?.length || 0} upper, ${bus.seatLayout.right.lower?.length || 0} lower`);
      console.log(`     Total Rows: ${bus.seatLayout.totalRows}`);
      
      fixedCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`✅ Fixed: ${fixedCount} buses`);
    console.log(`⏭️  Skipped (already valid): ${skippedCount} buses`);
    console.log(`📦 Total: ${buses.length} buses`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error during migration:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await connectDB();
    await fixBusSeatLayouts();
    console.log('✅ Migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

main();

/**
 * Migration script to convert old bus seat layouts to new format
 * Run this once to update existing buses in the database
 * 
 * Usage: node backend/scripts/migrateBusLayouts.js
 */

const mongoose = require('mongoose');
const Bus = require('../models/busModel');
require('dotenv').config({ path: '../.env' });

const migrateLayouts = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find all buses
    const buses = await Bus.find({});
    console.log(`📊 Found ${buses.length} buses to check`);

    let updated = 0;
    let skipped = 0;

    for (const bus of buses) {
      // Check if bus has new layout format (left/right)
      const hasNewLayout = bus.seatLayout && 
                          bus.seatLayout.left && 
                          bus.seatLayout.right;

      if (hasNewLayout) {
        console.log(`⏭️  Skipping bus ${bus.busNumber} - already has new layout`);
        skipped++;
        continue;
      }

      console.log(`🔄 Migrating bus ${bus.busNumber}...`);

      // Convert old layout to new format
      const totalRows = 10; // Default rows
      const leftSeats = [];
      const rightSeats = [];

      // Generate new layout based on bus type
      if (bus.seatType === 'sleeper' || bus.seatType === 'semi-sleeper') {
        // For sleeper: 1 upper + 1 lower on each side per row
        for (let row = 1; row <= totalRows; row++) {
          // Left side
          leftSeats.push(
            {
              seatNumber: `LU${row}`,
              seatType: 'upper',
              position: { row, side: 'left', level: 'upper', seat: 1 }
            },
            {
              seatNumber: `LL${row}`,
              seatType: 'lower',
              position: { row, side: 'left', level: 'lower', seat: 1 }
            }
          );

          // Right side
          rightSeats.push(
            {
              seatNumber: `RU${row}`,
              seatType: 'upper',
              position: { row, side: 'right', level: 'upper', seat: 1 }
            },
            {
              seatNumber: `RL${row}`,
              seatType: 'lower',
              position: { row, side: 'right', level: 'lower', seat: 1 }
            }
          );
        }
      } else {
        // For seater: 2 seats on each side per row
        for (let row = 1; row <= totalRows; row++) {
          // Left side - 2 lower seats
          leftSeats.push(
            {
              seatNumber: `LL${row}-1`,
              seatType: 'lower',
              position: { row, side: 'left', level: 'lower', seat: 1 }
            },
            {
              seatNumber: `LL${row}-2`,
              seatType: 'lower',
              position: { row, side: 'left', level: 'lower', seat: 2 }
            }
          );

          // Right side - 2 lower seats
          rightSeats.push(
            {
              seatNumber: `RL${row}-1`,
              seatType: 'lower',
              position: { row, side: 'right', level: 'lower', seat: 1 }
            },
            {
              seatNumber: `RL${row}-2`,
              seatType: 'lower',
              position: { row, side: 'right', level: 'lower', seat: 2 }
            }
          );
        }
      }

      // Trim to match total seats
      const totalSeatsNeeded = bus.totalSeats;
      const allSeats = [...leftSeats, ...rightSeats];
      const trimmedSeats = allSeats.slice(0, totalSeatsNeeded);

      // Separate back into left and right
      const newLeftSeats = trimmedSeats.filter(s => s.position.side === 'left');
      const newRightSeats = trimmedSeats.filter(s => s.position.side === 'right');

      // Update bus with new layout
      bus.seatLayout = {
        left: {
          upper: newLeftSeats.filter(s => s.position.level === 'upper'),
          lower: newLeftSeats.filter(s => s.position.level === 'lower')
        },
        right: {
          upper: newRightSeats.filter(s => s.position.level === 'upper'),
          lower: newRightSeats.filter(s => s.position.level === 'lower')
        },
        totalRows: totalRows
      };

      await bus.save();
      console.log(`✅ Migrated bus ${bus.busNumber}`);
      updated++;
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Updated: ${updated} buses`);
    console.log(`   ⏭️  Skipped: ${skipped} buses`);
    console.log('\n✨ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
};

// Run migration
migrateLayouts();

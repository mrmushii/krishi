/**
 * Seed script for hackathon demo data
 * Run this in browser console after Firebase is configured
 * 
 * Usage: Copy this file content and run in browser console after logging in
 */

import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

export const seedMockData = async () => {
  const today = new Date()
  const threeDaysAgo = new Date(today)
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  // Seed products
  const products = [
    {
      name: 'Organic Tomatoes',
      farmerId: 'demo-farmer-1',
      farmerName: 'Rajesh Kumar',
      quantity: 100,
      unit: 'kg',
      marketPrice: 50,
      listedAt: today.toISOString(),
      status: 'available',
      createdAt: Timestamp.now()
    },
    {
      name: 'Fresh Potatoes',
      farmerId: 'demo-farmer-2',
      farmerName: 'Priya Sharma',
      quantity: 200,
      unit: 'kg',
      marketPrice: 30,
      listedAt: threeDaysAgo.toISOString(), // Will show discount
      status: 'available',
      createdAt: Timestamp.now()
    },
    {
      name: 'Wheat',
      farmerId: 'demo-farmer-1',
      farmerName: 'Rajesh Kumar',
      quantity: 50,
      unit: 'quintal',
      marketPrice: 2000,
      listedAt: today.toISOString(),
      status: 'available',
      createdAt: Timestamp.now()
    },
    {
      name: 'Carrots',
      farmerId: 'demo-farmer-3',
      farmerName: 'Amit Patel',
      quantity: 75,
      unit: 'kg',
      marketPrice: 40,
      listedAt: threeDaysAgo.toISOString(),
      status: 'available',
      createdAt: Timestamp.now()
    }
  ]

  console.log('Seeding products...')
  for (const product of products) {
    try {
      const docRef = await addDoc(collection(db, 'products'), product)
      console.log('Added product:', docRef.id)
    } catch (err) {
      console.error('Error adding product:', err)
    }
  }

  console.log('Seed data completed!')
}

// Manual seed instructions in README


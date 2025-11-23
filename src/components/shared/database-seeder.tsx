
'use client';

import { useEffect, useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import {
  collection,
  writeBatch,
  getDocs,
  doc,
  query,
  Firestore,
} from 'firebase/firestore';
import { baseAssets, mockModules, mockBadges, mockQuizzes } from '@/lib/data';
import type { Quiz, SubModule } from '@/lib/types';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

async function seedCollection(
  firestore: Firestore,
  collectionName: string,
  data: any[],
  idField: string
) {
  const collectionRef = collection(firestore, collectionName);
  const snapshot = await getDocs(query(collectionRef));
  const existingIds = new Set(snapshot.docs.map(doc => doc.id));
  
  const itemsToSeed = data.filter(item => !existingIds.has(item[idField]));

  if (itemsToSeed.length > 0) {
    console.log(`Seeding ${itemsToSeed.length} new items into ${collectionName}...`);
    const batch = writeBatch(firestore);
    itemsToSeed.forEach((item) => {
      const docRef = doc(firestore, collectionName, item[idField]);
      batch.set(docRef, item);
    });
    
    try {
      await batch.commit();
      console.log(`${collectionName} seeded successfully.`);
    } catch (e) {
        console.error(`Error seeding ${collectionName}:`, e);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: collectionName,
            operation: 'create',
            requestResourceData: { note: `Batch write for ${itemsToSeed.length} documents.` }
        }));
    }
  } else {
    console.log(`${collectionName} is up to date. No new items to seed.`);
  }
}

async function seedModulesAndQuizzes(firestore: Firestore) {
    console.log(`Checking modules and quizzes for seeding...`);
    const batch = writeBatch(firestore);

    // Check which modules already exist
    const modulesRef = collection(firestore, 'modules');
    const modulesSnapshot = await getDocs(query(modulesRef));
    const existingModuleIds = new Set(modulesSnapshot.docs.map(doc => doc.id));
    const modulesToSeed = mockModules.filter(module => !existingModuleIds.has(module.id));

    if (modulesToSeed.length > 0) {
      console.log(`Seeding ${modulesToSeed.length} new modules...`);
      modulesToSeed.forEach((module) => {
          const moduleDocRef = doc(firestore, 'modules', module.id);
          const moduleDataForFirestore = {
              id: module.id,
              title: module.title,
              description: module.description,
              orderIndex: module.orderIndex,
              thumbnail: module.thumbnail,
              curriculum: module.curriculum,
          };
          batch.set(moduleDocRef, moduleDataForFirestore);
      });
    }

    // Check which quizzes already exist
    const quizzesRef = collection(firestore, 'quizzes');
    const quizzesSnapshot = await getDocs(query(quizzesRef));
    const existingQuizIds = new Set(quizzesSnapshot.docs.map(doc => doc.id));
    const quizzesToSeed = mockQuizzes.filter(quiz => !existingQuizIds.has(quiz.id));

    if (quizzesToSeed.length > 0) {
        console.log(`Seeding ${quizzesToSeed.length} new quizzes...`);
        quizzesToSeed.forEach((quiz) => {
          const quizDocRef = doc(firestore, 'quizzes', quiz.id);
          batch.set(quizDocRef, quiz);
        });
    }

    if (quizzesToSeed.length > 0 || modulesToSeed.length > 0) {
        try {
            await batch.commit();
            console.log('New modules and/or quizzes seeded successfully.');
        } catch (e) {
            console.error('Error seeding modules and/or quizzes:', e);
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: 'modules_or_quizzes',
                operation: 'create', // Explicitly 'create' because we filtered non-existing
                requestResourceData: { note: `Batch create for new modules/quizzes.` }
            }));
        }
    } else {
        console.log("Modules and quizzes are up to date. No new items to seed.");
    }
}


export function DatabaseSeeder() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [isSeeding, setIsSeeding] = useState(true);

  useEffect(() => {
    const seedAllData = async () => {
      // Wait for user to be loaded and ensure firestore is available.
      if (!firestore || isUserLoading) return;

      // Only run the seeder if a user is logged in.
      if (!user) {
        console.log("User not logged in, skipping database seeding.");
        setIsSeeding(false);
        return;
      }
      
      console.log("User logged in. Checking if database needs seeding...");
      
      await seedCollection(firestore, 'assets', baseAssets.map(a => ({...a, price: a.initialPrice})), 'symbol');
      await seedCollection(firestore, 'badges', mockBadges, 'id');
      await seedModulesAndQuizzes(firestore);
      
      console.log("Seeding check complete.");
      setIsSeeding(false);
    };

    seedAllData();
  }, [firestore, user, isUserLoading]);

  // This component doesn't render anything visible
  return null;
}

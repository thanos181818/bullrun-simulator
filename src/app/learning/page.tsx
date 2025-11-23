
'use client';
import { ModuleList } from '@/components/learning/module-list';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
} from 'firebase/firestore';
import type { Module } from '@/lib/types';

export default function LearningPage() {
  const firestore = useFirestore();

  const modulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'modules'));
  }, [firestore]);

  const { data: modules, isLoading } = useCollection<Module>(modulesQuery);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Learning Hub</h1>
      <p className="text-muted-foreground">
        Expand your trading knowledge with our curated modules.
      </p>
      <ModuleList modules={modules || []} isLoading={isLoading} />
    </div>
  );
}

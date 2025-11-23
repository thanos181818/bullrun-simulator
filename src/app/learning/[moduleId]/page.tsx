
'use client';

import { useState, useMemo, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import type { Module as ModuleType, SubModule } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { checkAndAwardBadges } from '@/lib/badge-service';

export default function ModulePage() {
  const params = useParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const moduleId = typeof params.moduleId === 'string' ? params.moduleId : '';

  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userData } = useDoc(userDocRef);

  const moduleDocRef = useMemoFirebase(() => {
      if (!firestore || !moduleId) return null;
      return doc(firestore, 'modules', moduleId);
  }, [firestore, moduleId]);

  const { data: module, isLoading: isModuleLoading } = useDoc<ModuleType>(moduleDocRef);

  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [completedInModule, setCompletedInModule] = useState(0);
  
  useEffect(() => {
    if (userData && module?.curriculum) {
      const allCompleted = new Set([
        ...(userData.modulesCompleted || []),
        ...(userData.quizzesCompleted || [])
      ]);
      setCompletedItems(allCompleted);
      
      const moduleCurriculumIds = new Set(module.curriculum.map(item => item.id));
      const completedCount = Array.from(allCompleted).filter(id => moduleCurriculumIds.has(id)).length;
      setCompletedInModule(completedCount);
    }
  }, [userData, module]);


  const saveProgress = async (itemId: string, itemType: 'content') => {
    if (!userDocRef) return;
    try {
      const fieldToUpdate = 'modulesCompleted';
      await updateDoc(userDocRef, {
        [fieldToUpdate]: arrayUnion(itemId),
      });
      setCompletedItems((prev) => new Set(prev).add(itemId));
      checkAndAwardBadges(firestore, user!.uid, toast);
    } catch (error) {
      console.error("Failed to save progress:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: "Could not save your progress.",
      });
    }
  };
  
  if (isModuleLoading) {
      return (
          <div className="flex flex-col gap-6">
               <div>
                  <Skeleton className="h-10 w-48" />
              </div>
               <div className="space-y-2">
                  <Skeleton className="h-10 w-1/2" />
                  <Skeleton className="h-6 w-3/4" />
              </div>
              <div className="space-y-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
              </div>
              <div className="space-y-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
          </div>
      )
  }

  if (!module) {
    notFound();
  }
  
  const handleContentComplete = (contentId: string) => {
    saveProgress(contentId, 'content');
  };
  
  const progress = module.curriculum ? (completedInModule / module.curriculum.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" asChild>
          <Link href="/learning">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Learning Hub
          </Link>
        </Button>
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{module.title}</h1>
        <p className="text-lg text-muted-foreground">{module.description}</p>

      </div>

      <div className="space-y-4">
        <Label>Progress</Label>
        <Progress value={progress} />
      </div>

      <Accordion
        type="multiple"
        defaultValue={module.curriculum && module.curriculum.length > 0 ? [module.curriculum[0].id] : []}
        className="w-full"
      >
        {module.curriculum && module.curriculum.map((item, index) => {
          const isLocked =
            index > 0 && !completedItems.has(module.curriculum[index - 1].id);
          
          return (
            <AccordionItem value={item.id} key={item.id} disabled={isLocked}>
              <AccordionTrigger
                className={cn(isLocked && 'text-muted-foreground')}
              >
                <div className="flex items-center gap-2">
                  {completedItems.has(item.id) && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {isLocked ? '🔒' : item.type === 'quiz' ? '❓' : '📖'}
                  <span
                    className={cn(completedItems.has(item.id) && 'line-through')}
                  >
                    {item.title}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4">
                <div className="prose dark:prose-invert">
                  {item.type === 'content' ? (
                    <div>
                      <div
                        dangerouslySetInnerHTML={{ __html: (item as SubModule).content }}
                      />
                      <Button
                        className="mt-4"
                        onClick={() => handleContentComplete(item.id)}
                        disabled={completedItems.has(item.id)}
                      >
                        {completedItems.has(item.id) ? 'Completed' : 'Mark as Complete'}
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p>Test your knowledge with this short quiz.</p>
                      <Button asChild className="mt-4">
                        <Link href={`/learning/${moduleId}/quiz/${item.id}`}>
                           {completedItems.has(item.id) ? 'Review Quiz' : 'Start Quiz'}
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {progress === 100 && (
        <Alert
          variant="default"
          className="mt-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
        >
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="font-bold text-green-700 dark:text-green-300">
            Module Complete!
          </AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-400">
            Congratulations! You have successfully completed the {module.title}{' '}
            module.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

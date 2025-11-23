
'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  useDoc,
  useFirestore,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import type { Quiz as QuizType } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, Award, Repeat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { checkAndAwardBadges } from '@/lib/badge-service';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Pie, PieChart } from "recharts"


export default function QuizResultsPage() {
  const params = useParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const moduleId = typeof params.moduleId === 'string' ? params.moduleId : '';
  const quizId = typeof params.quizId === 'string' ? params.quizId : '';
  
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isProcessed, setIsProcessed] = useState(false);

  const quizDocRef = useMemoFirebase(() => {
    if (!firestore || !quizId) return null;
    return doc(firestore, 'quizzes', quizId);
  }, [firestore, quizId]);
  
  const { data: quiz, isLoading } = useDoc<QuizType>(quizDocRef);
  
  useEffect(() => {
    const savedAnswers = localStorage.getItem(`quiz-${quizId}-answers`);
    if (savedAnswers) {
      setAnswers(JSON.parse(savedAnswers));
    }
  }, [quizId]);

  useEffect(() => {
    if (quiz && user && Object.keys(answers).length > 0 && !isProcessed) {
      const correctAnswers = quiz.questions.filter(
        (q) => answers[q.id] === q.correctIndex
      ).length;
      const totalQuestions = quiz.questions.length;
      const score = (correctAnswers / totalQuestions) * 100;

      if (score >= 80) { // Assuming 80% is a pass
        const userDocRef = doc(firestore, 'users', user.uid);
        updateDoc(userDocRef, {
          quizzesCompleted: arrayUnion(quizId),
        }).then(() => {
            checkAndAwardBadges(firestore, user.uid, toast);
            toast({
                title: 'Quiz Passed!',
                description: "Great job! You've unlocked the next section.",
            });
        });
      }
      setIsProcessed(true); // Mark as processed
    }
  }, [quiz, user, answers, quizId, firestore, toast, isProcessed]);
  
  const handleRetry = () => {
    window.location.href = `/learning/${moduleId}/quiz/${quizId}?retry=true`;
  }


  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!quiz || !quiz.questions) {
    return notFound();
  }

  const correctAnswers = quiz.questions.filter(
    (q) => answers[q.id] === q.correctIndex
  ).length;
  const totalQuestions = quiz.questions.length;
  const score = (correctAnswers / totalQuestions) * 100;
  const passed = score >= 80;

  const chartData = [
    { name: 'Correct', value: correctAnswers, fill: 'hsl(var(--chart-1))' },
    { name: 'Incorrect', value: totalQuestions - correctAnswers, fill: 'hsl(var(--chart-2))' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Quiz Results: {quiz.title}</CardTitle>
          <CardDescription>Here's how you did.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
            <div className='flex flex-col items-center'>
              <ChartContainer config={{}} className="mx-auto aspect-square h-[200px]">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} />
                </PieChart>
              </ChartContainer>
              <p className="text-4xl font-bold mt-[-115px] mb-[75px]">{score.toFixed(0)}%</p>
            </div>
            
            <div className="flex flex-col gap-4 items-center md:items-start">
               {passed ? (
                 <Alert variant="default" className="border-green-500 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700">
                    <Award className="h-4 w-4" />
                    <AlertTitle>Congratulations!</AlertTitle>
                    <AlertDescription>You passed the quiz!</AlertDescription>
                 </Alert>
               ) : (
                  <Alert variant="destructive">
                    <Repeat className="h-4 w-4" />
                    <AlertTitle>Almost there!</AlertTitle>
                    <AlertDescription>Review the material and try again to pass.</AlertDescription>
                  </Alert>
               )}
                <div className="text-center md:text-left">
                    <p>You answered <span className='font-bold'>{correctAnswers}</span> out of <span className='font-bold'>{totalQuestions}</span> questions correctly.</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link href={`/learning/${moduleId}`}>Back to Module</Link>
                    </Button>
                    {!passed && <Button variant="outline" onClick={handleRetry}>Retry Quiz</Button>}
                </div>
            </div>
          </div>


          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Your Answers</h3>
            {quiz.questions.map((question) => {
              const userAnswerIndex = answers[question.id];
              const isCorrect = userAnswerIndex === question.correctIndex;
              return (
                <div key={question.id} className="rounded-lg border p-4">
                  <p className="font-medium mb-2">{question.question}</p>
                  <div className="space-y-2">
                    {question.options.map((option, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-2 rounded-md p-2 text-sm
                            ${index === question.correctIndex ? 'bg-green-100 dark:bg-green-900/30' : ''}
                            ${index === userAnswerIndex && !isCorrect ? 'bg-red-100 dark:bg-red-900/30' : ''}`}
                      >
                        {index === userAnswerIndex ? (
                          isCorrect ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )
                        ) : index === question.correctIndex ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : <div className="h-4 w-4" />
                        }
                        <span>{option}</span>
                      </div>
                    ))}
                  </div>
                  {!isCorrect && (
                    <Alert className="mt-4" variant="default">
                      <AlertTitle>Explanation</AlertTitle>
                      <AlertDescription>
                        {question.explanation}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter>
            <Button asChild className='w-full'>
                <Link href="/learning">Explore Other Modules</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, notFound, useSearchParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { Quiz as QuizType, Question } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Fisher-Yates shuffle algorithm
const shuffleArray = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();

  const moduleId = typeof params.moduleId === 'string' ? params.moduleId : '';
  const quizId = typeof params.quizId === 'string' ? params.quizId : '';

  const quizDocRef = useMemoFirebase(() => {
    if (!firestore || !quizId) return null;
    return doc(firestore, 'quizzes', quizId);
  }, [firestore, quizId]);

  const { data: quiz, isLoading } = useDoc<QuizType>(quizDocRef);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (quiz && quiz.questions) {
      const isRetry = searchParams.get('retry') === 'true';
      if (isRetry) {
        // On retry, clear old answers and shuffle options for each question
        localStorage.removeItem(`quiz-${quizId}-answers`);
        setAnswers({});

        const newShuffledQuestions = quiz.questions.map(q => {
            const originalOptions = [...q.options];
            const originalCorrectIndex = q.correctIndex;
            const correctOptionValue = originalOptions[originalCorrectIndex];

            const shuffledOptions = shuffleArray(originalOptions);
            const newCorrectIndex = shuffledOptions.findIndex(opt => opt === correctOptionValue);

            return {
                ...q,
                options: shuffledOptions,
                correctIndex: newCorrectIndex,
            };
        });
        setShuffledQuestions(newShuffledQuestions);
      } else {
        // On first attempt, use original questions and load saved progress
        setShuffledQuestions(quiz.questions);
        const savedAnswers = localStorage.getItem(`quiz-${quizId}-answers`);
        if (savedAnswers) {
          setAnswers(JSON.parse(savedAnswers));
        }
      }
    }
  }, [quiz, quizId, searchParams]);

  if (isLoading || !quiz || shuffledQuestions.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-48 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }

  const handleAnswerChange = (questionId: string, optionIndex: number) => {
    const newAnswers = { ...answers, [questionId]: optionIndex };
    setAnswers(newAnswers);
    localStorage.setItem(`quiz-${quizId}-answers`, JSON.stringify(newAnswers));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };
  
  const handleSubmit = () => {
    // The answers are already saved in localStorage.
    // The results page will read from there.
    router.push(`/learning/${moduleId}/quiz/${quizId}/results`);
  }

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const answeredQuestionsCount = Object.keys(answers).length;
  const progress = (answeredQuestionsCount / shuffledQuestions.length) * 100;
  const isLastQuestion = currentQuestionIndex === shuffledQuestions.length - 1;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="ghost" asChild>
          <Link href={`/learning/${moduleId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Module
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{quiz.title}</CardTitle>
          <CardDescription>
            Question {currentQuestionIndex + 1} of {shuffledQuestions.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
             <Label>Progress</Label>
             <Progress value={progress} />
          </div>
          <div>
            <p className="text-lg font-medium mb-4">{currentQuestion.question}</p>
            <RadioGroup
              value={answers[currentQuestion.id]?.toString()}
              onValueChange={(value) =>
                handleAnswerChange(currentQuestion.id, parseInt(value))
              }
            >
              {currentQuestion.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center space-x-3 rounded-md border p-4 has-[:checked]:border-primary">
                  <RadioGroupItem
                    value={optionIndex.toString()}
                    id={`${currentQuestion.id}-${optionIndex}`}
                  />
                  <Label className="font-normal" htmlFor={`${currentQuestion.id}-${optionIndex}`}>
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={prevQuestion} disabled={currentQuestionIndex === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>
          
          {isLastQuestion ? (
             <Button onClick={handleSubmit} disabled={answeredQuestionsCount !== shuffledQuestions.length}>Submit Quiz</Button>
          ): (
            <Button onClick={nextQuestion}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

        </CardFooter>
      </Card>
    </div>
  );
}

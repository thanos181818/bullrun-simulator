'use client';
import { mockModules } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Module } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';

interface ModuleListProps {
  modules?: Module[];
  isLoading: boolean;
}

export function ModuleList({ modules, isLoading }: ModuleListProps) {

  if (isLoading) {
      return (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(4)].map((_, i) => (
                  <Card key={i} className="flex flex-col">
                      <CardHeader className='p-0'>
                          <Skeleton className="h-40 w-full" />
                      </CardHeader>
                      <CardContent className="flex-1 p-4">
                           <Skeleton className="h-6 w-3/4 mb-2" />
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-full mt-1" />
                      </CardContent>
                      <CardFooter className='p-4 pt-0'>
                          <Skeleton className="h-10 w-full" />
                      </CardFooter>
                  </Card>
              ))}
          </div>
      )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {modules && modules.map((module) => (
        <Card key={module.id} className="flex flex-col">
          <CardHeader className="p-0">
            <div className="relative h-40 w-full">
              <Image
                src={module.thumbnail}
                alt={module.title}
                fill
                className="object-cover"
                data-ai-hint="stock graph"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-4">
            <CardTitle className="mb-2 text-lg">{module.title}</CardTitle>
            <CardDescription>{module.description}</CardDescription>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Button asChild className="w-full">
              <Link href={`/learning/${module.id}`}>
                Start Learning <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

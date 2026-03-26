/**
 * Utilitário para merge de class names (Tailwind CSS).
 * Combina clsx (condicionais) + tailwind-merge (resolução de conflitos).
 * 
 * @example
 * ```tsx
 * import { cn } from '@/lib/utils';
 * 
 * <div className={cn(
 *   'bg-white p-4',
 *   isActive && 'bg-blue-500',
 *   className
 * )} />
 * ```
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

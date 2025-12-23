import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type StatTrend = 'positive' | 'negative' | 'neutral';

export function getStatTrend(statName: string, value: number): StatTrend {
  const lowerStat = statName.toLowerCase();
  
  // Drop percentage - lower is better
  if (lowerStat.includes('drop')) {
    if (value < 5) return 'positive';
    if (value > 10) return 'negative';
    return 'neutral';
  }
  
  // Yards per catch - higher is better
  if (lowerStat.includes('ypc') || lowerStat.includes('yards per catch') || lowerStat.includes('avgyardspercat ch')) {
    if (value > 12) return 'positive';
    if (value < 8) return 'negative';
    return 'neutral';
  }
  
  // Yards per rush - higher is better
  if (lowerStat.includes('ypr') || lowerStat.includes('yards per rush') || lowerStat.includes('avgyardsperrush')) {
    if (value > 4.5) return 'positive';
    if (value < 3.5) return 'negative';
    return 'neutral';
  }
  
  // EPA - higher is better
  if (lowerStat.includes('epa')) {
    if (value > 0.1) return 'positive';
    if (value < -0.1) return 'negative';
    return 'neutral';
  }
  
  // YPRR (Yards Per Route Run) - higher is better
  if (lowerStat.includes('yprr')) {
    if (value > 2.0) return 'positive';
    if (value < 1.2) return 'negative';
    return 'neutral';
  }
  
  // Target Share - higher is better
  if (lowerStat.includes('target share') || lowerStat.includes('targetshare')) {
    if (value > 20) return 'positive';
    if (value < 10) return 'negative';
    return 'neutral';
  }
  
  // Snap % - higher is better
  if (lowerStat.includes('snap')) {
    if (value > 70) return 'positive';
    if (value < 50) return 'negative';
    return 'neutral';
  }
  
  // Catch Rate - higher is better
  if (lowerStat.includes('catch rate') || lowerStat.includes('catchrate')) {
    if (value > 70) return 'positive';
    if (value < 55) return 'negative';
    return 'neutral';
  }
  
  // YAC per reception - higher is better
  if (lowerStat.includes('yac')) {
    if (value > 5) return 'positive';
    if (value < 3) return 'negative';
    return 'neutral';
  }
  
  // ADOT (Average Depth of Target) - context dependent, but generally higher is good for deep threats
  if (lowerStat.includes('adot') || lowerStat.includes('depth')) {
    if (value > 12) return 'positive';
    if (value < 6) return 'negative';
    return 'neutral';
  }
  
  // Touchdowns - more is better
  if (lowerStat.includes('td') || lowerStat.includes('touchdown')) {
    if (value >= 5) return 'positive';
    if (value === 0) return 'negative';
    return 'neutral';
  }
  
  // General yards - more is better
  if (lowerStat.includes('yard')) {
    if (value > 800) return 'positive';
    if (value < 300) return 'negative';
    return 'neutral';
  }
  
  // Default to neutral
  return 'neutral';
}


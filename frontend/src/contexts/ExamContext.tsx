import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { SupportedLanguage } from '../types';

interface ExamContextType {
  selectedLanguage: SupportedLanguage;
  setSelectedLanguage: (lang: SupportedLanguage) => void;
  codeMap: Record<string, string>;
  setCodeForLang: (code: string) => void;
  autoSaveStatus: string;
  activeConsoleTab: string;
  setActiveConsoleTab: (tab: string) => void;
  compilerResult: any;
  customInput: string;
  setCustomInput: (val: string) => void;
  isRunning: boolean;
  isSubmitting: boolean;
  isSubmittedSuccessfully: boolean;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const ExamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('go');
  const [codeMap, setCodeMap] = useState<Record<string, string>>({
    go: `package main

import "fmt"

// twoSum returns indices of two numbers that sum up to target
func twoSum(nums []int, target int) []int {
	// Write your Go code here
	m := make(map[int]int)
	for i, num := range nums {
		diff := target - num
		if idx, found := m[diff]; found {
			return []int{idx, i}
		}
		m[num] = i
	}
	return []int{}
}

func main() {
	nums := []int{2, 7, 11, 15}
	target := 9
	fmt.Println(twoSum(nums, target))
}`,
    javascript: `// Two Sum
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            return [map.get(diff), i];
        }
        map.set(nums[i], i);
    }
    return [];
}`,
    python: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`
  });
  const [activeConsoleTab, setActiveConsoleTab] = useState('output');
  const [customInput, setCustomInput] = useState('');

  const setCodeForLang = (code: string) => {
    setCodeMap(prev => ({ ...prev, [selectedLanguage]: code }));
  };

  return (
    <ExamContext.Provider value={{
      selectedLanguage,
      setSelectedLanguage,
      codeMap,
      setCodeForLang,
      autoSaveStatus: 'Saved',
      activeConsoleTab,
      setActiveConsoleTab,
      compilerResult: null,
      customInput,
      setCustomInput,
      isRunning: false,
      isSubmitting: false,
      isSubmittedSuccessfully: false
    }}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const ctx = useContext(ExamContext);
  if (!ctx) throw new Error('useExam must be used within ExamProvider');
  return ctx;
};

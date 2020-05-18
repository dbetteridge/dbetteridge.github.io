---
templateKey: blog-post
title: Advent of Code 2019 - Day 2
date: 2019-12-02T11:44:10.000Z
featuredpost: true
# featuredimage: ./explain.jpg
description: On the way to your gravity assist around the Moon, your ship computer beeps angrily about a "1202 program alarm". On the radio, an Elf is already explaining how to handle the situation "Don't worry, that's perfectly norma--" The ship computer bursts into flames.
tags:
  - golang
  - adventofcode
  - puzzles
---

## Day 2: 1202 Program Alarm

### Part 1 - Build an Intcode computer!

The magic smoke has escaped, we need to build an Intcode computer that can run our gravity assist program and start things over from the 1202 program alarm.

I've gone for a simple switch statement run in a loop, I clone the array before starting to avoid mutating the input.

```go
func runInstructions(inputInstructions []int) int {
	index := 0
	memory := make([]int, len(inputInstructions))
	copy(memory, inputInstructions)
	for index < len(memory)-1 {
		opCode := memory[index]
		firstAddress := index + 1
		secondAddress := firstAddress + 1
		storageAddress := secondAddress + 1
		switch opCode {
		case 99:
			index += 4
		case 1:
			leftValue := memory[memory[firstAddress]]
			rightValue := memory[memory[secondAddress]]
			storeLocation := memory[storageAddress]

			memory[storeLocation] = leftValue + rightValue
			index += 4
		case 2:
			leftValue := memory[memory[firstAddress]]
			rightValue := memory[memory[secondAddress]]
			storeLocation := memory[storageAddress]

			memory[storeLocation] = leftValue * rightValue
			index += 4
		}
	}
	return memory[0]
}
```

## Part 2 - Find the verb and noun that give you 19690720.

For this we simply run through all the pairs of noun and verb between 0 and 99.

```go
func findNounAndVerb(memory []int) (int, int) {
	noun, verb := 0, 0
	for noun = 0; noun < 99; noun++ {
		memory[1] = noun
		for verb = 0; verb < 99; verb++ {
			memory[2] = verb
			result := runInstructions(memory)
			if result == 19690720 {
				return noun, verb
			}
		}
	}
	return noun, verb
}
```

Final result noun 60 , verb 86

If you have any feedback on my Go code, I'd be happy to hear it!

[Github Repo](https://github.com/dbetteridge/adventofcode2019)
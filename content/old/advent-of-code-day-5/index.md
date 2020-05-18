---
templateKey: blog-post
title: Advent of Code 2019 - Day 5
date: 2019-12-05T11:44:10.000Z
featuredpost: true
# featuredimage: ./explain.jpg
description: You're starting to sweat as the ship makes its way toward Mercury. The Elves suggest that you get the air conditioner working by upgrading your ship computer to support the Thermal Environment Supervision Terminal.
tags:
  - golang
  - adventofcode
  - puzzles
---

## Day 5: Sunny with a Chance of Asteroids

### Part 1 - Its getting hot in here

1. Add two new instructions to our intcode computer (3) which takes an input value and places it into the given location and (4) which outputs the value at the given position
2. Extend our intcode to support immediate mode in addition to positional, this reads the value directly at a given memory address rather then treating that value as a pointer to the actual value

```go
func getAddressOrValue(memory []int, index int, mode int) int {
	if mode == 0 {
		return memory[memory[index]]
	}
	return memory[index]
}

func setAddressOrValue(memory []int, index int, value int) {

	memory[memory[index]] = value
}

func runInstructions(inputInstructions []int) int {
	index := 0
	memory := make([]int, len(inputInstructions))
	copy(memory, inputInstructions)
	input := 5
	for index < len(memory)-1 {
		opCode := memory[index]
		firstAddress := index + 1
		secondAddress := firstAddress + 1
		storageAddress := secondAddress + 1
		modes := []int{0, 0, 0}
		if opCode > 10 {
			imOpCode := strconv.Itoa(opCode)
			opCode = 0
			modeCount := 5 - len(imOpCode)
			for i, c := range imOpCode {
				intC, err := strconv.Atoi(string(c))
				check(err)
				if i == len(imOpCode)-1 || i == len(imOpCode)-2 {
					opCode += intC
				} else {
					modes[modeCount] = intC
					modeCount++
				}

			}
			fmt.Println(imOpCode, opCode, modes)
		}
		switch opCode {
		case 99:
			index = len(memory) - 1
		case 1:
			leftValue := getAddressOrValue(memory, firstAddress, modes[len(modes)-1])
			rightValue := getAddressOrValue(memory, secondAddress, modes[len(modes)-2])
			setAddressOrValue(memory, storageAddress, leftValue+rightValue)
			index += 4
		case 2:
			leftValue := getAddressOrValue(memory, firstAddress, modes[len(modes)-1])
			rightValue := getAddressOrValue(memory, secondAddress, modes[len(modes)-2])
			setAddressOrValue(memory, storageAddress, leftValue*rightValue)
			index += 4
		case 3:
			setAddressOrValue(memory, index+1, input)
			index += 2
		case 4:
			fmt.Println(getAddressOrValue(memory, index+1, modes[2]))
			index += 2
		default:
			index = len(memory) - 1
		}
	}
	return memory[0]
}
```

Bit of a hacky solution but it gets the job done, any opcode > 10 is parsed in reverse to determine the mode bits for its parameters.

### Part 2 - Turns out space doesn't conduct heat very well

For part 2 we need to add 4 instructions to allow us to extend the ships radiative coolers.

1. If true
2. If false
3. Less than
4. Equal

```go
case 5:
    leftValue := getAddressOrValue(memory, index+1, modes[len(modes)-1])
    rightValue := getAddressOrValue(memory, index+2, modes[len(modes)-2])
    if leftValue != 0 {
        index = rightValue
    } else {
        index += 3
    }
case 6:
    leftValue := getAddressOrValue(memory, index+1, modes[len(modes)-1])
    rightValue := getAddressOrValue(memory, index+2, modes[len(modes)-2])
    if leftValue == 0 {
        index = rightValue
    } else {
        index += 3
    }
case 7:
    leftValue := getAddressOrValue(memory, index+1, modes[len(modes)-1])
    rightValue := getAddressOrValue(memory, index+2, modes[len(modes)-2])
    if leftValue < rightValue {
        setAddressOrValue(memory, storageAddress, 1)
    } else {
        setAddressOrValue(memory, storageAddress, 0)
    }
    index += 4
case 8:
    leftValue := getAddressOrValue(memory, index+1, modes[len(modes)-1])
    rightValue := getAddressOrValue(memory, index+2, modes[len(modes)-2])
    if leftValue == rightValue {
        setAddressOrValue(memory, storageAddress, 1)
    } else {
        setAddressOrValue(memory, storageAddress, 0)
    }
    index += 4
```

### Conclusion

Not a bad couple of problems here, got stuck for a while as I was incorrectly looking at the memory pointer rather then the memory for case 4.

If you have any feedback on my Go code, I'd be happy to hear it!

[Github Repo](https://github.com/dbetteridge/adventofcode2019)

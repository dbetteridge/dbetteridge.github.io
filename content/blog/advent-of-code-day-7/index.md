---
templateKey: blog-post
title: Advent of Code 2019 - Day 7
date: 2019-12-07T11:44:10.000Z
featuredpost: true
# featuredimage: ./explain.jpg
description: Based on the navigational maps, you're going to need to send more power to your ship's thrusters to reach Santa in time. To do this, you'll need to configure a series of amplifiers already installed on the ship.
tags:
  - golang
  - adventofcode
  - puzzles
---

## Day 7: Amplification circuit

### Part 1 - Boost it!

There are five amplifiers connected in series; each one receives an input signal and produces an output signal. They are connected such that the first amplifier's output leads to the second amplifier's input, the second amplifier's output leads to the third amplifier's input, and so on. The first amplifier's input value is 0, and the last amplifier's output leads to your ship's thrusters.

```go
func runComputer(inputInstructions []int, inputs []int) (int, int) {
	index := 0

	memory := make([]int, len(inputInstructions))
	copy(memory, inputInstructions)

	inputIndex := 0
	outputs := 0
	for index < len(memory) {
		opCode := memory[index]
		firstAddress := index + 1
		secondAddress := firstAddress + 1
		storageAddress := secondAddress + 1
		modes := []int{0, 0, 0}
		if opCode > 10 && opCode != 99 {
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
		}
		switch opCode {
		case 99:
			index = len(memory)
			return outputs, index
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
			setAddressOrValue(memory, index+1, inputs[inputIndex])
			index += 2
			inputIndex++
		case 4:
			outputs = getAddressOrValue(memory, index+1, modes[2])
			index += 2
			return outputs, index
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
		default:
			index = len(memory)
		}
	}
	fmt.Println("Mem end", memory, index, len(memory))
	return outputs, index
}

func heapPermutation(results [][]int, phases []int, size int) [][]int {
	if size == 1 {
		temp := make([]int, len(phases))
		copy(temp, phases)
		results = append(results, temp)
		return results
	}

	for i := 0; i < size; i++ {
		results = heapPermutation(results, phases, size-1)

		// if size is odd, swap first and last
		// element
		temp := make([]int, len(phases))
		copy(temp, phases)
		if size%2 == 1 {
			phases[0] = phases[size-1]
			phases[size-1] = temp[0]

			// If size is even, swap ith and last
			// element
		} else {
			phases[i] = phases[size-1]
			phases[size-1] = temp[i]
		}
	}
	return results
}

func main() {
	lines := readFileToArray("input.txt")
	linesAsArray := strings.Split(lines[0], ",")

	instructions := instructionsFromArray(linesAsArray)
	maxAmp := -99999
	phases := []int{0,1,2,3,4}
	results := [][]int{}
	results = heapPermutation(results, phases, 5)

	for p := 0; p < len(results); p++ {
		input1, input2, input3, input4, input5 := []int{results[p][0]}, []int{results[p][1]}, []int{results[p][2]}, []int{results[p][3]}, []int{results[p][4]}
		out1, out2, out3, out4, out5 := 0, 0, 0, 0, 0
		input1 = append(input1, out5)
		out1 = runComputer(instructions, input1)
		input2 = append(input2, out1)
		out2 = runComputer(instructions, input2)
		input3 = append(input3, out2)
		out3 = runComputer(instructions, input3)
		input4 = append(input4, out3)
		out4 = runComputer(instructions, input4)
		input5 = append(input5, out4)
		out5 = runComputer(instructions, input5)
		if out5 > maxAmp {
			maxAmp = out5
		}
	}
	fmt.Println(maxAmp)
}
```

This required a few changes to our existing intcode computer to properly deal with outputs.

### Part 2 - We need more power captain!

The simple chain of 5 amplifiers isn't enough to power the engines, so the elves suggest looping the output of Amplifier E into Amplifier A.

```go
func runComputer(inputInstructions []int, inputs []int, startIndex int) (int, int) {
	index := 0

	memory := make([]int, len(inputInstructions))
	copy(memory, inputInstructions)

	inputIndex := 0
	outputs := 0
	for index < len(memory) {
		opCode := memory[index]
		firstAddress := index + 1
		secondAddress := firstAddress + 1
		storageAddress := secondAddress + 1
		modes := []int{0, 0, 0}
		if opCode > 10 && opCode != 99 {
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
		}
		switch opCode {
		case 99:
			index = len(memory)
			return outputs, index
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
			setAddressOrValue(memory, index+1, inputs[inputIndex])
			index += 2
			inputIndex++
		case 4:
			outputs = getAddressOrValue(memory, index+1, modes[2])
			index += 2
			if index > startIndex {
				return outputs, index
			}
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
		default:
			index = len(memory)
		}
	}
	fmt.Println("Mem end", memory, index, len(memory))
	return outputs, index
}

func main() {
	lines := readFileToArray("input.txt")
	linesAsArray := strings.Split(lines[0], ",")

	instructions := instructionsFromArray(linesAsArray)
	maxAmp := -99999
	phases := []int{5, 6, 7, 8, 9}
	results := [][]int{}
	results = heapPermutation(results, phases, 5)
	loop := true

	for p := 0; p < len(results); p++ {
		loop = true
		input1, input2, input3, input4, input5 := []int{results[p][0]}, []int{results[p][1]}, []int{results[p][2]}, []int{results[p][3]}, []int{results[p][4]}
		out1, out2, out3, out4, out5 := 0, 0, 0, 0, 0
		ind1, ind2, ind3, ind4, ind5 := 0, 0, 0, 0, 0
		for loop {
			input1 = append(input1, out5)
			out1, ind1 = runComputer(instructions, input1, ind1)
			input2 = append(input2, out1)
			out2, ind2 = runComputer(instructions, input2, ind2)
			input3 = append(input3, out2)
			out3, ind3 = runComputer(instructions, input3, ind3)
			input4 = append(input4, out3)
			out4, ind4 = runComputer(instructions, input4, ind4)
			input5 = append(input5, out4)
			out5, ind5 = runComputer(instructions, input5, ind5)
			if ind5 < len(instructions) {
				if out5 > maxAmp {
					maxAmp = out5
				}
			} else {
				loop = false
			}
		}

	}
	fmt.Println(maxAmp)
}
```

We link the output of Amplifier E into the input of Amplifier A, looping until Amplifier E reaches the end of its instructions and halts. The output of Amplifier E is compared to our recorded maximum and if it is greater then we store it.

### Conclusion

Part 1 here was easy, requiring only a small modification to the existing intcode computer to handle multiple inputs. Part 2 was a bit of a challenge, my eventual approach was to store the index in memory when an output happens and use this as a check, the next run through the same amplifier will only output once it has moved passed that first output index in memory.

If you have any feedback on my Go code, I'd be happy to hear it!

[Github Repo](https://github.com/dbetteridge/adventofcode2019)

---
templateKey: blog-post
title: Advent of Code 2019
date: 2019-12-02T11:44:10.000Z
featuredpost: true
# featuredimage: ./explain.jpg
description: My approach to the advent of code 2019 problems, first year doing this and going to be using Go
tags:
  - golang
  - adventofcode
  - puzzles
---

## Day 1: The Tyranny of the Rocket Equation

### Part 1 - Fuel by mass

Fuel required to launch a given module is based on its mass. Specifically, to find the fuel required for a module, take its mass, divide by three, round down, and subtract 2.

First things first we want to implement a basic function to pull our input file into a Go structure, this makes our future work easier.

```golang
func readFileToArray(filename string) []string {
	dat, err := ioutil.ReadFile(filename)
	check(err)

	lines := strings.Split(string(dat), "\n")
	return lines
}
```

Next up, we need to calculate and return our total fuel required

```golang
func calcFuel(line int, sum int) int {
	fuel := (line / 3) - 2
    return fuel
}

func main() {
	lines := readFileToArray("input.txt")
	sum := 0
	for _, x := range lines {
		line, err := strconv.ParseInt(x, 10, 64)
		if err == nil {
			sum += calcFuel(int(line), sum)
		}
	}
	fmt.Println(sum)
}
```

## Part 2 - Apparently, you forgot to include additional fuel for the fuel you just added.

Turns out, fuel has mass too! we need to add additional fuel for each unit of fuel we include.

I chose to go with a recursive approach, though a simple loop would work too.

```golang
func calcFuel(line int, sum int) int {
	fuel := (line / 3) - 2

	if fuel > 0 {
		sum += fuel
		sum = calcFuel(fuel, sum)
		return sum
	}

	return sum
}

func main() {
	lines := readFileToArray("input.txt")
	sum := 0
	for _, x := range lines {
		line, err := strconv.ParseInt(x, 10, 64)
		if err == nil {
			sum = calcFuel(int(line), sum)
		}
	}
	fmt.Println(sum)
}
```

Keep adding the smaller and smaller quantities of fuel to our total until the fuel amount <= 0

And thats it!


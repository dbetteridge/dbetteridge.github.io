---
templateKey: blog-post
title: Advent of Code 2019 - Day 1
date: 2019-12-01T11:44:10.000Z
featuredpost: true
# featuredimage: ./explain.jpg
description: Day 1 - Fuel calculations. Santa has become stranded at the edge of the Solar System while delivering presents to other planets! To accurately calculate his position in space, safely align his warp drive, and return to Earth in time to save Christmas, he needs you to bring him measurements from fifty stars.
tags:
  - golang
  - adventofcode
  - puzzles
---

My approach to the advent of code 2019 problems, first year doing this and going to be using Go

## Day 1: The Tyranny of the Rocket Equation

### Part 1 - Fuel by mass

Fuel required to launch a given module is based on its mass. Specifically, to find the fuel required for a module, take its mass, divide by three, round down, and subtract 2.

First things first we want to implement a basic function to pull our input file into a Go structure, this makes our future work easier.

```go
func readFileToArray(filename string) []string {
	dat, err := ioutil.ReadFile(filename)
	check(err)

	lines := strings.Split(string(dat), "\n")
	return lines
}
```

Next up, we need to calculate and return our total fuel required

```go
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

```go
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

[Github Repo](https://github.com/dbetteridge/adventofcode2019)

---
templateKey: blog-post
title: Advent of Code 2019 - Day 6
date: 2019-12-06T11:44:10.000Z
featuredpost: true
# featuredimage: ./explain.jpg
description: You've landed at the Universal Orbit Map facility on Mercury. Because navigation in space often involves transferring between orbits, the orbit maps here are useful for finding efficient routes between, for example, you and Santa. You download a map of the local orbits (your puzzle input).
tags:
  - golang
  - adventofcode
  - puzzles
---

## Day 6: Universal orbit map

### Part 1 - Who orbits who?

Except for the universal Center of Mass (COM), every object in space is in orbit around exactly one other object.

For part 1 we want to count the total direct and indirect orbits, for this task we count the direct orbits as we parse the input file.
For the indirect orbits we need to keep track of the parent body for each object, We move through the list of each object in our map, 
if an object has a parent and that parent is not the Center of Mass (COM) we increase our count of indirect orbits and move to the parent object, repeating till we reach COM.

```go
func rec(orbits map[string]string, key string, totalOrbits int) int {
	if orbits[key] != "COM" {
		totalOrbits++
		return rec(orbits, orbits[key], totalOrbits)
	}
	return totalOrbits
}

func getTotalOrbits(orbits map[string]string, orbitStrs []string, totalOrbits int) {
	for _, orbitStr := range orbitStrs {
		orbitArr := strings.Split(orbitStr, ")")
		if len(orbitArr) < 2 {
			break
		}
		parent := orbitArr[0]
		key := orbitArr[1]
		orbits[key] = parent
		totalOrbits++
	}
	for key := range orbits {
		totalOrbits = rec(orbits, key, totalOrbits)
	}

	fmt.Println(totalOrbits)
}

func main() {
	orbitStrs := readFileToArray("input.txt")
	var orbits map[string]string
	orbits = make(map[string]string)
	totalOrbits := 0

    getTotalOrbits(orbits, orbitStrs, totalOrbits)
}
```

I've used a map of the object names => parent to make this process pretty each, starting from the first object name we move through the map recursively calling the parent of each object till we reach COM for that branch, and summing the total indirect orbits.

### Part 2 - Operation Santa

Find the number of orbital movements required to be in the same orbit as Santa,
I used the existing approach from above with a small modification, where I store each visited object starting at both YOU and SAN.
We can then traverse these two lists till we find a common object around which both YOU and SANTA are orbiting, the number of visited objects for YOU and SANTA are then added together for the total movements.

```go
func visitedOrbits(orbits map[string]string, key string, visited []string) []string {
	if orbits[key] != "COM" {
		visited = append(visited, orbits[key])
		return visitedOrbits(orbits, orbits[key], visited)
	}
	return visited
}

func findCommon(visitedYOU []string, visitedSANTA []string) (int, int) {
	for y, visitedY := range visitedYOU {
		for s, visitedS := range visitedSANTA {
			if visitedY == visitedS {
				return y, s
			}
		}
	}
	return 0, 0
}

func main() {
	orbitStrs := readFileToArray("input.txt")
	var orbits map[string]string
	orbits = make(map[string]string)
	totalOrbits := 0

	for _, orbitStr := range orbitStrs {
		orbitArr := strings.Split(orbitStr, ")")
		if len(orbitArr) < 2 {
			break
		}
		parent := orbitArr[0]
		key := orbitArr[1]
		orbits[key] = parent
	}
	visitedYOU := []string{}
	visitedSANTA := []string{}

	visitedYOU = visitedOrbits(orbits, "YOU", visitedYOU)
	visitedSANTA = visitedOrbits(orbits, "SAN", visitedSANTA)
	countY, countS := findCommon(visitedYOU, visitedSANTA)
	totalOrbits = countS + countY
	fmt.Println(totalOrbits)
}
```

### Conclusion

A good bit of recursive fun, tried to take a similar approach to Depth first search with storing parents and visited nodes which worked well.

If you have any feedback on my Go code, I'd be happy to hear it!

[Github Repo](https://github.com/dbetteridge/adventofcode2019)

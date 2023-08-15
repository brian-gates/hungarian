function OptimalAssignments(strArr) { 
  const matrix = strArr.map(row => row.slice(1, -1).split(',').map(Number))
  return hungarian(matrix)
}

// https://en.wikipedia.org/wiki/Hungarian_algorithm
function hungarian(matrix) {
  let state = {
    rows_covered: matrix.map(_ => false),
    columns_covered: matrix[0].map(_ => false),
    starred: matrix.map(row => row.map(_ => 0)),
    primes: matrix.map(row => row.map(_ => 0)),
    start: undefined,
    path: undefined,
  }
  // step 1
  const matrixZeroed = zero(matrix)
  // step 2
  const starred = starZeroes({ matrix: matrixZeroed, state })
  // step 3
  const covered = coverStarredColumns(starred)
  console.table(covered.matrix)
  console.table(covered.state.path)
  console.table(covered.state)

  return getResult(covered)

}


// step 1
function zero(matrix) {
  return columnsZeroed(rowsZeroed(matrix))
}

// step 2
function starZeroes({ matrix, state }) {
  let x, y
  while (true) {
    [x, y] = findUncoverdZero({ matrix, state })
    if (x === -1) break
    starZero({ matrix, state, position: [x, y] })
  }
  return { matrix, state: clearCovers(state) }
}

// step 3
function coverStarredColumns({ matrix, state }) {
  matrix.forEach((row, x) => {
    return row.forEach((_, y) => {
      if (state.starred[x][y] === 1) {
        coverColumn({ matrix, state, column: y })
      }
    })
  })
  if (state.columns_covered.every(covered => covered)) {
    return { matrix, state }
  }
  return primeZeroes({ matrix, state })
}

// step 4
function primeZeroes({ matrix, state }) {
  let x, y = -1
  while (true) {
    [x, y] = findUncoverdZero({ matrix, state })
    if (x === -1) {
      return augment({ matrix, state })
    }
    state.starred[x][y] = 2
    const starredColumn = findStarInColumn({ matrix, state, column: x })
    if (starredColumn > -1) {
      coverRow({ matrix, state, row: x })
      coverColumn({ matrix, state, column: starredColumn })
      starZero({ matrix, state, position: [x, starredColumn] })
    } else {
      state.start = [x, y]
      return createPath({ matrix, state })
    }
  }
}

// step 5
function createPath({ matrix, state }) {
  let step = 0
  const path = [state.start]
  let done = false
  while (!done) {
    const x = findStarInColumn({ matrix, state, column: path[step][1] })
    if (x === -1) {
      done = true
    } else {
      step++
      path.push([x, path[step-1][1]])
    }
    if (!done) {
      step++
      const y = findPrimeInRow({ matrix, state, row: path[step][0] })
      path.push([path[step-1][0], y])
    }
  }
  return convertPath({ matrix, state: { ...clearCovers(clearPrimes(state)), path } })
}

// step 6
function augment({ matrix, state }) {
  const min = findSmallestUncovered({ matrix, state })
  return primeZeroes({
    state,
    matrix: matrix.map((row, x) =>
      row.map((_, y) => {
        if (isCoveredRow({ state, row: x })) {
          matrix[x][y] += min
        }
        if (!isCoveredColumn({ state, column: y })) {
          matrix[x][y] -= min
        }
      })
    ),
  })
}

function getResult({ matrix, state }) {
  return getStarredZeroes({ matrix, state })
    .map(([x, y]) => [x + 1, y + 1])
}


function starZero({ matrix, state, position }) {
  const [x, y] = position
  state.starred[x][y] = 1
  coverRow({ matrix, state, row: x })
  coverColumn({ matrix, state, column: y })
  return { matrix, state }
}
  
function coverRow({ matrix, state, row }) {
  state.rows_covered[row] = true
  return { matrix, state }
}

function isCoveredRow({ state, row }) {
  return state.rows_covered[row]
}

function coverColumn({ matrix, state, column }) {
  state.columns_covered[column] = true
  return { matrix, state }
}

function isCoveredColumn({ state, column }) {
  return state.columns_covered[column]
}

function getStarredZeroes({ matrix, state }) {
  return matrix.reduce((acc, row, i) => {
    return row.reduce((acc, _, j) => {
      if (state.starred[i][j] === 1) {
        acc.push([i, j])
      }
      return acc
    }, acc)
  }, [])
}

function rowsZeroed(matrix) {
  return matrix.map(row => {
    const min = Math.min(...row)
    return row.map(num => num - min)
  })
}

function columnsZeroed(matrix) {
  const minColValues = matrix.map((_, column) => Math.min(...matrix.map(row => row[column])))
  return matrix.map((row, i) => row.map((num, j) => num - minColValues[j]))
}

function clearCovers(state) {
  return {
    ...state,
    rows_covered: state.rows_covered.map(_ => false),
    columns_covered: state.columns_covered.map(_ => false),
  }
}

function clearPrimes(state) {
  return {
    ...state,
    primes: state.primes.map(row => row.map(_ => 0))
  }
}

function findPrimeInRow({ matrix, state, row }) {
  return matrix[row].reduce((acc, _, y) => {
    if (state.primes[row][y] === 1) return y
    return acc
  }, -1)
}

function findStarInRow({ matrix, state, row }) {
  return matrix[row].reduce((acc, num, j) => {
    if(state.starred[row][j] === 1) return j
    return acc
  }, -1)
}
  
function findStarInColumn({ matrix, state, column }) {
  return matrix.reduce((acc, _, i) => {
    if(state.starred[i][column] === 1) return i
    return acc
  }, -1)
}


function findUncoverdZero({matrix, state}) {
  return matrix.reduce((acc, row, x) => {
    return row.reduce((acc, num, y) => {
      if (num === 0 && !isCoveredRow({ state, row: x }) && !isCoveredColumn({ state, column: y })) {
        return [x, y]
      }
      return acc
    }, acc)
  }, [-1, -1])
}

function rowsWithZero(matrix) {
  return matrix.map(row => row.every(num => num !== 0))
}

function columnsWithZero(matrix) {
  return matrix[0].map((_, i) => matrix.every(row => row[i] !== 0))
}

function convertPath({ matrix, state }) {
  return {
    state,
    matrix: matrix.map((row, i) =>
      row.map((_, j) =>
        state.starred[i][j] === 1 ? 1 : 0
      )
    )
  }
}

function findSmallestUncovered({ matrix, state }) {
  return matrix.reduce((acc, row, x) =>
    row.reduce((acc, num, y) =>
      !isCoveredRow({ state, row: x }) && !isCoveredColumn({ state, column: y }) && num < acc ? num : acc
      , acc)
    , Infinity)
}

// keep this function call here 
// console.log(OptimalAssignments(["(1,2,1)","(4,1,5)","(5,2,1)"]));
console.log(OptimalAssignments(["(13,4,7,6)","(1,11,5,4)","(6,7,2,8)","(1,3,5,9)"]));

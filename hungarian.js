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
  
  zero(matrix)
  let step = starZeroes(matrix, state)
  while (typeof step === 'function') {
    step = step(matrix, state)
  }
  // console.table(matrix)
  // console.table(state.path)

  const result = getResult(matrix, state)
  console.table(result)
  return result

}


// step 1
function zero(matrix) {
  columnsZeroed(matrix)
  rowsZeroed(matrix)
}

// step 2
function starZeroes(matrix, state) {
  let x, y
  while (true) {
    [x, y] = findUncoverdZero(matrix, state)
    if (x === -1) break
    starZero(state, [x, y])
  }
  clearCovers(state)
  return coverStarredColumns
}

// step 3
function coverStarredColumns(matrix, state) {
  matrix.forEach((row, x) => {
    row.forEach((_, y) => {
      if (state.starred[x][y] === 1) {
        coverColumn(state, y)
      }
    })
  })
  if (state.columns_covered.every(covered => covered)) {
    return // done!
  }
  return primeZeroes
}

// step 4
function primeZeroes(matrix, state) {
  let x, y = -1
  while (true) {
    [x, y] = findUncoverdZero(matrix, state)
    if (x === -1) {
      return augment
    }
    state.starred[x][y] = 2
    const starredColumn = findStarInColumn(matrix, state, x)
    if (starredColumn > -1) {
      coverRow(state, x)
      coverColumn(state, starredColumn)
      starZero(state, [x, starredColumn])
    } else {
      state.start = [x, y]
      return createPath
    }
  }
}

// step 5
function createPath(matrix, state) {
  let step = 0
  const path = [state.start]
  let done = false
  while (!done) {
    const x = findStarInColumn(matrix, state, path[step][1])
    if (x === -1) {
      done = true
    } else {
      step++
      path.push([x, path[step-1][1]])
    }
    if (!done) {
      step++
      const y = findPrimeInRow(matrix, state, path[step][0])
      path.push([path[step-1][0], y])
    }
  }
  clearCovers(state)
  clearPrimes(state)
  convertPath(matrix, state)
  return coverStarredColumns
}

// step 6
function augment(matrix, state) {
  const min = findSmallestUncovered(matrix, state)
  if (min === Infinity) {
    return // done!
  }

  matrix.forEach((row, x) =>
    row.forEach((_, y) => {
      if (isCoveredRow(state, x)) {
        matrix[x][y] += min
      }
      if (!isCoveredColumn(state, y)) {
        matrix[x][y] -= min
      }
    })
  )
  return primeZeroes
}

function getResult(matrix, state) {
  return getStarredZeroes(matrix, state)
    .map(([x, y]) => [x + 1, y + 1])
}


function starZero(state, position) {
  const [x, y] = position
  state.starred[x][y] = 1
  coverRow(state, x)
  coverColumn(state, y)
}
  
function coverRow(state, row) {
  state.rows_covered[row] = true
}

function isCoveredRow(state, row) {
  return state.rows_covered[row]
}

function coverColumn(state, column) {
  state.columns_covered[column] = true
}

function isCoveredColumn(state, column) {
  return state.columns_covered[column]
}

function getStarredZeroes(matrix, state) {
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
  matrix.forEach((row, x) => {
    const min = Math.min(...row)
    row.forEach((_, y) => matrix[x][y] -= min)
  })
}

function columnsZeroed(matrix) {
  const minColValues = matrix.map((_, column) => Math.min(...matrix.map(row => row[column])))
  matrix.forEach((row, x) =>
    row.map((_, y) => matrix[x][y] - minColValues[x])
  )
}

function clearCovers(state) {
  state.rows_covered = state.rows_covered.map(_ => false)
  state.columns_covered = state.columns_covered.map(_ => false)
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

function findStarInRow(matrix, state, row) {
  return matrix[row].reduce((acc, _, j) => {
    if(state.starred[row][j] === 1) return j
    return acc
  }, -1)
}
  
function findStarInColumn(matrix, state, column) {
  return matrix.reduce((acc, _, i) => {
    if(state.starred[i][column] === 1) return i
    return acc
  }, -1)
}


function findUncoverdZero(matrix, state) {
  return matrix.reduce((acc, row, x) => {
    return row.reduce((acc, num, y) => {
      if (num === 0 && !isCoveredRow(state, x) && !isCoveredColumn(state, y)) {
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

function convertPath(matrix, state) {
  return {
    state,
    matrix: matrix.map((row, i) =>
      row.map((_, j) =>
        state.starred[i][j] === 1 ? 1 : 0
      )
    )
  }
}

function findSmallestUncovered(matrix, state) {
  return matrix.reduce((acc, row, x) =>
    row.reduce((acc, num, y) =>
      !isCoveredRow(state, x) && !isCoveredColumn(state, y) && num < acc ? num : acc
      , acc)
    , Infinity)
}

// keep this function call here 
console.log(OptimalAssignments(["(1,2,1)","(4,1,5)","(5,2,1)"]));
console.log(OptimalAssignments(["(13,4,7,6)","(1,11,5,4)","(6,7,2,8)","(1,3,5,9)"]));

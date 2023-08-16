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
    start: undefined,
    path: undefined,
  }
  
  zero(matrix)
  let step = starZeroes(matrix, state)
  while (typeof step === 'function') {
    step = step(matrix, state)
  }
  // console.table(matrix)
  console.table(state.path)

  const result = getResult(matrix, state)
  console.table(result)
  return result
}

// step 1
function zero(matrix) {
  columnsZeroed(matrix)
  // rowsZeroed(matrix)
}

// step 2
function starZeroes(matrix, state) {
  matrix.forEach((row, rowIndex) => 
    row.forEach((value, columnIndex) => {
      if (value !== 0) return
      if (isCoveredRow(state, rowIndex)) return
      if (isCoveredColumn(state, columnIndex)) return
      starZero(state, [rowIndex, columnIndex])
    })
  )
  clearCovers(state)
  return coverStarredColumns
}

// step 3
function coverStarredColumns(matrix, state) {
  matrix.forEach((row, rowIndex) => {
    row.forEach((_, columnIndex) => {
      if (state.starred[rowIndex][columnIndex] === 1) {
        coverColumn(state, columnIndex)
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
  while (true) {
    const [rowIndex, columnIndex] = findUncoverdZero(matrix, state)
    if (rowIndex === -1) return augment
    state.starred[rowIndex][columnIndex] = 2
    const starredColumn = findStarInRow(matrix, state, rowIndex)
    if (starredColumn > -1) {
      coverRow(state, rowIndex)
      unCoverColumn(state, starredColumn)
    } else {
      state.start = [rowIndex, columnIndex]
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
    const rowIndex = findStarInColumn(matrix, state, path[step][1])
    if (rowIndex === -1) {
      done = true
    } else {
      step++
      path.push([rowIndex, path[step-1][1]])
    }
    if (!done) {
      const columnIndex = findPrimeInRow(matrix, state, path[step][0])
      step++
      path.push([path[step-1][0], columnIndex])
    }
  }
  state.path = path;
  convertPath(state)
  clearCovers(state)
  clearPrimes(state)
  return coverStarredColumns
}

// step 6
function augment(matrix, state) {
  const min = findSmallestUncovered(matrix, state)

  matrix.forEach((row, rowIndex) =>
    row.forEach((_, columnIndex) => {
      if (isCoveredRow(state, rowIndex)) {
        matrix[rowIndex][columnIndex] += min
      }
      if (!isCoveredColumn(state, columnIndex)) {
        matrix[rowIndex][columnIndex] -= min
      }
    })
  )
  return primeZeroes
}

function getResult(matrix, state) {
  return getStarredZeroes(matrix, state)
    .map(([row, column]) => [row + 1, column + 1])
}

function starZero(state, position) {
  const [rowIndex, columnIndex] = position
  state.starred[rowIndex][columnIndex] = 1
  coverRow(state, rowIndex)
  coverColumn(state, columnIndex)
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

function unCoverColumn(state, column) {
  state.columns_covered[column] = false
}

function isCoveredColumn(state, column) {
  return state.columns_covered[column]
}

function getStarredZeroes(matrix, state) {
  return matrix.reduce((acc, row, i) => {
    return row.reduce((acc, _, j) => {
      if (state.starred[i][j] === 1) {
        return [...acc, [i, j]]
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
  const minColValues = matrix.map((_, x) => Math.min(...matrix.map(row => row[x])))
  matrix.forEach((row, x) =>
    row.forEach((_, y) => matrix[x][y] -= minColValues[y])
  )
}

function clearCovers(state) {
  state.rows_covered = state.rows_covered.map(_ => false)
  state.columns_covered = state.columns_covered.map(_ => false)
}

function clearPrimes(state) {
  state.starred.forEach((row, rowIndex) =>
    row.forEach((value, columnIndex) => {
      if (value === 2) {
        state.starred[rowIndex][columnIndex] = 0
      }
    })
  )
}

function findPrimeInRow(matrix, state, rowIndex) {
  return matrix[rowIndex].reduce((acc, _, columnIndex) => {
    if (state.starred[rowIndex][columnIndex] === 2) return columnIndex
    return acc
  }, -1)
}

function findStarInRow(matrix, state, rowIndex) {
  return matrix[rowIndex].reduce((acc, _, columnIndex) => {
    if(acc !== -1) return acc
    if(state.starred[rowIndex][columnIndex] === 1) return columnIndex
    return acc
  }, -1)
}
  
function findStarInColumn(matrix, state, columnIndex) {
  return matrix.reduce((acc, _, rowIndex) => {
    if(state.starred[rowIndex][columnIndex] === 1) return rowIndex
    return acc
  }, -1)
}


function findUncoverdZero(matrix, state) {
  return matrix.reduce((acc, row, rowIndex) =>
    row.reduce((acc, num, columnIndex) => {
      if (acc[0] !== -1) return acc
      if (num !== 0) return acc
      if (isCoveredColumn(state, columnIndex) || isCoveredRow(state, rowIndex)) return acc
      return [rowIndex, columnIndex]
    }, acc), [-1, -1])
}

function rowsWithZero(matrix) {
  return matrix.map(row => row.every(num => num !== 0))
}

function columnsWithZero(matrix) {
  return matrix[0].map((_, i) => matrix.every(row => row[i] !== 0))
}

function convertPath(state) {
  state.path.forEach(([rowIndex, columnIndex]) => {
    if (state.starred[rowIndex][columnIndex] === 1) {
      state.starred[rowIndex][columnIndex] = 0
    } else {
      state.starred[rowIndex][columnIndex] = 1
    }
  })
}

function findSmallestUncovered(matrix, state) {
  return matrix.reduce((acc, row, rowIndex) =>
    row.reduce((acc, num, columnIndex) => {
      if (isCoveredColumn(state, columnIndex) || isCoveredRow(state, rowIndex)) return acc
      return num < acc ? num : acc
    }, acc)
  , parseInt(Number.MAX_SAFE_INTEGER/2))
}

// keep this function call here 
// console.log(OptimalAssignments(["(1,2,1)","(4,1,5)","(5,2,1)"]));
console.log(OptimalAssignments(["(13,4,7,6)","(1,11,5,4)","(6,7,2,8)","(1,3,5,9)"]));

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
  const matrixZeroed = zeroed(matrix)
  const starred = starZeroes({ matrix: matrixZeroed, state })
  const covered = coverStarredColumns(starred)
  if (getStarredZeroes(covered).length === matrix.length) {
    return covered.state.starred
  }
  const primed = primeZeroes(covered)
  const x = createPath(primed)
  console.table(primed.matrix)
  console.table(primed.state)
}

function createPath({ matrix, state }) {
  let step = 0
  const path = [state.start]
  let done = false
  while (!done) {
    const x = findStarInRow({ matrix, state, row: path[step][0] })
    if (x === -1) {
      done = true
    } else {
      const x = findStarInRow({ matrix, state, row: path[step][0] })
    }
  }
}

function primeZeroes({ matrix, state }) {
  let x, y = -1
  while (true) {
    [x, y] = findUncoverdZero({ matrix, state })
    if (x === -1) break
    state.starred[x][y] = 2
    const starredColumn = findStarInColumn({ matrix, state, column: y })
    if (starredColumn !== -1) {
      coverRow({ matrix, state, row: x })
      coverColumn({ matrix, state, column: starredColumn })
      starZero({ matrix, state, position: [x, starredColumn] })
    } else {
      state.start = [x, y]
    }
  }
  return { matrix, state }
}

function findStarInRow({ matrix, state, row }) {
  return matrix[row].reduce((acc, num, j) => {
    if(state.starred[row][j] === 1) return j
    return acc
  }, -1)
}
  
function findStarInColumn({ matrix, state, column }) {
  return matrix.reduce((acc, row, i) => {
    if (state.starred[i][column] === 1) return i
    return acc
  }, -1)
}


function starZeroes({ matrix, state }) {
  let x, y
  while (true) {
    [x, y] = findUncoverdZero({ matrix, state })
    if (x === -1) break
    starZero({ matrix, state, position: [x, y] })
  }
  clearCovers(state)
  return { matrix, state }
}

function coverStarredColumns({ matrix, state }) {
  matrix.map((row, x) => {
    return row.map((num, y) => {
      if (state.starred.includes([x, y])) {
        coverColumn({ matrix, state, column: y })
      }
    })
  })
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

function starZero({ matrix, state, position }) {
  const [x, y] = position
  state.starred[x][y] = 1
  coverRow({ matrix, state, row: x })
  coverColumn({ matrix, state, column: y })
  return { matrix, state }
}

function getStarredZeroes({ matrix, state }) {
  return matrix.reduce((acc, row, i) => {
    return row.reduce((acc, num, j) => {
      if (state.starred[i][j] === 1) {
        acc.push([i, j])
      }
      return acc
    }, acc)
  }, [])
}

function zeroed(matrix) {
  return columnsZeroed(rowsZeroed(matrix))
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
    rows_covered: [],
    columns_covered: [],
  }
}

// find a zero that isn't in a covered row or column
function findUncoverdZero({matrix, state}) {
  return matrix.reduce((acc, row, i) => {
    return row.reduce((acc, num, j) => {
      if (num !== 0) return acc
      if (!isCoveredRow({ state, row: i }) && !isCoveredColumn({ state, column: j })) {
        return [i, j]
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

   
// keep this function call here 
// console.log(OptimalAssignments(["(1,2,1)","(4,1,5)","(5,2,1)"]));
console.log(OptimalAssignments(["(13,4,7,6)","(1,11,5,4)","(6,7,2,8)","(1,3,5,9)"]));

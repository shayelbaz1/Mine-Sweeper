'use strict'
const BOMB = '💣';
const FLAG = '🎌';
const EMPTY = "";
const LIVE = "❤️"
const NORMAL = "😃";
const LOSE = "🤯";
const WIN = "😎";
const SAFE = "🛡️";
const DONE = "⛔";


var intId_Timer
var gElH1 = document.querySelector('h1')
var gElTimer = document.querySelector('.timer')
var gElLives = document.querySelector('.lives')
var gElSafe = document.querySelector('.safe-click button')
var gElSmile = document.querySelector('.smile')
// The Model
// var gIsTimerOn
var gBoard;
var gLevel;
var gGame;
var g4points = [];
var g8points = [];
var g12points = [];



function init(size, mines) {
    reset(size, mines)
    gBoard = createBoard();
    renderBoard(gBoard, '.board-container');
    // localStorage.clear()
    renderTable()
}

function reset(size, mines) {
    clearInterval(intId_Timer)
    gGame = {
        isOn: false,
        isTimerOn: false,
        shownCount: 0,
        markedCount: 0,
        safes: [SAFE, SAFE, SAFE],
        secs: 0,
        gMinesLocations: [],
        lives: [LIVE, LIVE, LIVE],
        isFinish: false,
        isLose: false
    }
    gLevel = {
        SIZE: size,
        MINES: mines
    }

    localStorage.setItem(`Shay`, `Shay-4-2`);
    localStorage.setItem(`Gal`, `Gal-8-10`);
    localStorage.setItem(`Guy`, `Guy-12-20`);

    gElH1.classList.remove("lose", "win")
    gElH1.innerText = "שולה מוקשים"

    gElLives.innerText = ""
    gGame.lives.forEach(LIVE => { gElLives.innerText += LIVE })

    gElSafe.innerText = ""
    gGame.safes.forEach(SAFE => { gElSafe.innerText += SAFE })

    gElTimer.innerText = `000`
    gElSmile.innerHTML = `<button onclick="init(${size},${mines})">${NORMAL}</button>`
}
//pick a call with !isMine and add bgcolor for 2 sec
function safeClick() {
    if (gGame.isFinish) return
    if (gGame.isLose) return
    if (gGame.safes.length === 0) return

    gGame.safes.pop();

    gElSafe.innerText = ""
    gGame.safes.forEach(SAFE => { gElSafe.innerText += SAFE })

    if (gGame.safes.length === 0) {
        gElSafe.innerText = DONE
    }

    var emptys = [];
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[i].length; j++) {
            var cell = gBoard[i][j];
            if (cell.isMine) continue
            emptys.push({ i: i, j: j });
        }
    }
    //get random location
    var randomIdx = getRandomIntInclusive(0, emptys.length - 1);
    var location = emptys[randomIdx];
    var elButton = document.querySelector(`.cell${location.i}-${location.j} button`)

    elButton.style.backgroundColor = "lightgreen";
    // paint it for 2 sec
    setTimeout(function () {
        elButton.style.backgroundColor = "lightgrey";
    }, 1000)

}

function cellClicked(elTd, cellI, cellJ, event) {
    if (gGame.finish) return
    //context menu Is disabled
    window.oncontextmenu = (e) => {
        e.preventDefault();
    }

    var cell = gBoard[cellI][cellJ]

    if (!gGame.isTimerOn) startTimer()

    //if right click only timer start but game not started yet
    if (!gGame.isOn) {
        if (event.button === 2) {
            addFlag(cell, cellI, cellJ)
            return
        } else if (event.button === 0) {
            gGame.isOn = true
            addMines(cellI, cellJ)
            setMinesNegsCount()
        }

    }

    var bombCountNegs = cell.minesAroundCount

    if (event.button === 0) {

        if (!cell.isMarked && !cell.isShown) {
            cell.isShown = true
            if (bombCountNegs !== 0 && !cell.isMine) {
                elTd.innerText = bombCountNegs;
                gGame.shownCount++

            } else if (cell.isMine) {
                //for each cell.mine in the gBoard elTd.innerText=BOMB
                gGame.lives.pop()
                gElLives.innerText = ""
                gGame.lives.forEach(LIVE => { gElLives.innerText += LIVE })
                elTd.innerText = BOMB
                gGame.shownCount++
                if (gGame.lives.length === 0) {
                    gGame.isLose = true
                    var elSmileButton = document.querySelector('.smile button')
                    elSmileButton.innerText = LOSE
                    console.log('elSmile:', elSmileButton.innerText)
                    showAllBombs(elTd)
                }

            } else if (bombCountNegs === 0) {
                elTd.innerText = EMPTY
                gGame.shownCount++
                var negs = getAllNegs(cellI, cellJ)
                expandShown(negs)
                // expandShown1(cellI, cellJ)

            }
        }
    } else if (event.button === 2) {
        if (cell.isShown) return
        addFlag(cell, cellI, cellJ)
    }
    checkGameOver()
}

function startTimer() {

    gGame.isTimerOn = true

    intId_Timer = setInterval(function () {
        gGame.secs++
        if (gGame.secs < 10) {
            gElTimer.innerText = `00${gGame.secs}`
        } else if (gGame.secs >= 10 && gGame.secs <= 99) {
            gElTimer.innerText = `0${gGame.secs}`
        } else if (gGame.secs >= 100 && gGame.secs < 999) {
            gElTimer.innerText = `${gGame.secs}`
        } else if (gGame.secs === 999) {
            gElTimer.innerText = `999`
            clearInterval(intId_Timer)
        }

        if (gGame.finish) {
            clearInterval(intId_Timer)
        }
    }, 1000);
}

function createBoard() {
    var board = [];
    for (var i = 0; i < gLevel.SIZE; i++) {
        board.push([])
        for (var j = 0; j < gLevel.SIZE; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }

    return board;
}

function addMines(cellI, cellJ) {

    for (let i = 0; i < gLevel.MINES; i++) {
        addMine(cellI, cellJ)
    }
}

function addMine(cellI, cellJ) {

    //empty places array
    var emptys = [];
    for (let i = 0; i < gBoard.length; i++) {
        for (let j = 0; j < gBoard[i].length; j++) {
            var cell = gBoard[i][j];
            if (cell.isMine) continue
            if (cellI === i && cellJ === j) continue
            emptys.push({ i: i, j: j });

        }
    }
    var randomIdx = getRandomIntInclusive(0, emptys.length - 1);
    var location = emptys[randomIdx];

    // var elButton = document.querySelector(`.cell${location.i}-${location.j} button`)
    // elButton.style.backgroundColor = "yellow";

    gBoard[location.i][location.j].isMine = true;
    gGame.gMinesLocations.push(location)

    if (gBoard[location.i][location.j].isMine && gBoard[location.i][location.j].isMarked) {
        gGame.markedCount++
    }

}
function renderBoard(mat, selector) {
    var strHTML = '<table border="0"><tbody>';
    for (var i = 0; i < mat.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < mat[0].length; j++) {
            var cell = mat[i][j];

            // console.log('Show where is the Bomb');
            // cell = cell.isMine ? BOMB : EMPTY;
            cell = EMPTY;
            var className = 'cell cell' + i + '-' + j;
            strHTML += `<td 
            class="${className}"
            onmousedown="cellClicked(this , ${i},${j},event)"
            ><button> ${cell} </button></td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>';
    var elContainer = document.querySelector(selector);
    elContainer.innerHTML = strHTML;
}
//Run on all the cells and check then set to each sell his Mines Negs Count
function setMinesNegsCount() {
    for (var i = 0; i < gLevel.SIZE; i++) {
        for (var j = 0; j < gLevel.SIZE; j++) {
            var cell = gBoard[i][j]
            cell.minesAroundCount = countNeighbors(i, j)
        }
    }
}
function countNeighbors(cellI, cellJ) {
    var neighborsSum = 0;
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;
            if (i === cellI && j === cellJ) continue;
            if (gBoard[i][j].isMine) neighborsSum++;
        }
    }
    return neighborsSum;
}
//Return an array of all the negs of curr Cell
function getAllNegs(cellI, cellJ) {
    var negs = [];
    for (var i = cellI - 1; i <= cellI + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue;
        for (var j = cellJ - 1; j <= cellJ + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue;
            if (i === cellI && j === cellJ) continue;
            negs.push({ cell: gBoard[i][j], i: i, j: j })
        }
    }
    return negs;
}
function renderTable() {
    var strHTML = ""
    strHTML +=
        `<table>
          <tr>
              <th>Place</th>
              <th colspan="2">Easy</th>
              <th colspan="2">Medium</th>
              <th colspan="2">Hard</th>
          </tr>
          <tr>`

    g4points = []
    g8points = []
    g12points = []
    // localStorage.clear()
    //convert local storage to arrays
    localToArrays()
    //render Arrays to tables
    strHTML = renderArraysToCells(strHTML)
    strHTML += `</table>`

    var elPoints = document.querySelector('.points')
    elPoints.innerHTML = strHTML
}
function renderArraysToCells(strHTML) {
    g4points.sort((a, b) => a.secs - b.secs);
    g8points.sort((a, b) => a.secs - b.secs);
    g12points.sort((a, b) => a.secs - b.secs);
    for (var i = 0; i < localStorage.length; i++) {
        if (!g4points[i] && !g8points[i] && !g12points[i]) continue;
        strHTML += `<td>${i + 1}</td>`
        strHTML += updateTd(g4points[i])
        strHTML += updateTd(g8points[i])
        strHTML += updateTd(g12points[i])
        strHTML += `<tr>`
    }
    return strHTML
}
function updateTd(nameData) {
    if (!nameData) return `<td></td><td></td>`

    var name = nameData.name
    var secs = nameData.secs

    name = name.toLowerCase()
    name = name.charAt(0).toUpperCase() + name.slice(1)

    return `<td>${name}</td><td>${secs}s</td>`
}
function localToArrays() {
    for (var i = 0; i < localStorage.length; i++) {
        var currKey = localStorage.getItem(localStorage.key(i))
        var values = currKey.split('-')
        var data = getItemData(values)
        pushDataToArrayByLevel(data)
    }
}
function checkGameOver() {
    //if all BOMBS is marked and all cell is shown
    var allCells = gLevel.SIZE ** 2

    // setTimeout(updateLocalStorage, 11000)

    if (allCells === gGame.markedCount + gGame.shownCount) {
        gElH1.classList.add("win")

        renderElementInnerText("h1", "YOU WIN!")
        renderElementInnerText(".smile button", WIN)


        clearInterval(intId_Timer)
        setTimeout(updateLocalStorage, 500)
        gGame.finish = true;

    }
}
function updateLocalStorage() {
    var name = prompt('Enter your name')
    localStorage.setItem(`${name}`, `${name}-${gLevel.SIZE}-${gGame.secs}`);
    console.log('localStorage:', localStorage)
    renderTable()
}
function pushDataToArrayByLevel(data) {
    switch (data.level) {
        case 4:
            g4points.push(data)
            break;
        case 8:
            g8points.push(data)
            break;
        case 12:
            g12points.push(data)
            break;
        default:
            break;
    }
}
function getItemData(values) {
    var data = { name: "name", level: "level", secs: 0 };
    data.name = values[0]
    data.level = +values[1]
    data.secs = + values[2]
    return data
}
function renderElementInnerText(selector, innerText) {
    var element = document.querySelector(selector)
    element.innerText = innerText
}
function expandShown(negs) {
    for (let i = 0; i < negs.length; i++) {
        var currCell = negs[i].cell;
        var elTdNeg = document.querySelector(`.cell${negs[i].i}-${negs[i].j}`)
        if (currCell.isMarked) continue
        if (currCell.isShown) continue
        currCell.isShown = true
        //if the cell has a number show it
        if (currCell.minesAroundCount !== 0) {
            elTdNeg.innerText = currCell.minesAroundCount
            //if the cell is empty expand it
        } else {
            elTdNeg.innerText = EMPTY
            //get all the negs of the cell in an array
            var currNegs = getAllNegs(negs[i].i, negs[i].j)
            //check the current each negs and if it empty check it to
            expandShown(currNegs)
        }
        gGame.shownCount++

    }
}
function showAllBombs(elTd) {
    var mines = gGame.gMinesLocations
    for (let i = 0; i < mines.length; i++) {
        var loc = mines[i];
        // var mineObject = gBoard[loc.i][loc.j]
        var elTdMine = document.querySelector(`.cell${loc.i}-${loc.j}`)
        elTdMine.innerText = BOMB
    }

    elTd.style.backgroundColor = "red";
    gElH1.classList.add("lose")
    gElH1.innerText = 'GAME OVER'

    gGame.finish = true
    clearInterval(intId_Timer)
}
function addFlag(cell, cellI, cellJ) {
    var elButton = document.querySelector(`.cell${cellI}-${cellJ} button`)
    cell.isMarked = !cell.isMarked
    elButton.innerText = cell.isMarked ? FLAG : EMPTY

    //Count only mines
    if (cell.isMarked && cell.isMine) {
        gGame.markedCount += 1;
    } else if (!cell.isMarked && cell.isMine) {
        gGame.markedCount -= 1
    }
}
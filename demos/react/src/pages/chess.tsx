import { useCallback, useState } from 'react'
import { Container, Draggable, type DropResult } from '@likelylogic/react-smooth-dnd'

type Side = 'black' | 'white'

/** An empty square is `{}`; a occupied one carries its glyph and side. */
interface Piece {
  type?: string
  side?: Side
  data?: number
  hover?: boolean
}

interface Payload {
  rowIndex: number
  colIndex: number
  piece: Piece
}

type Board = Piece[][]

/** White code points; black is the same glyph plus 6. */
function getFirstPieceRow (side: Side): Piece[] {
  return [
    { type: 'rook', side, data: 9816 },
    { type: 'knight', side, data: 9814 },
    { type: 'bishop', side, data: 9815 },
    { type: 'queen', side, data: 9813 },
    { type: 'king', side, data: 9812 },
    { type: 'bishop', side, data: 9815 },
    { type: 'knight', side, data: 9814 },
    { type: 'rook', side, data: 9816 },
  ]
}

function getSecondPieceRow (side: Side): Piece[] {
  return generateRow(() => ({ type: 'pawn', side, data: 9817 }))
}

function generateRow (create: () => Piece): Piece[] {
  return Array.from({ length: 8 }, create)
}

function initBoard (): Board {
  const board: Board = []

  for (let i = 0; i < 8; i++) {
    if (i === 0) {
      board.push(getFirstPieceRow('black'))
    }
    else if (i === 1) {
      board.push(getSecondPieceRow('black'))
    }
    else if (i === 6) {
      board.push(getSecondPieceRow('white'))
    }
    else if (i === 7) {
      board.push(getFirstPieceRow('white'))
    }
    else {
      board.push(generateRow(() => ({})))
    }
  }

  return board
}

/**
 * Every square is its own `drop-zone` container holding at most one piece.
 *
 * `shouldAcceptDrop` is where the rule lives: a square refuses a piece of its
 * own colour, so you can capture but not stack.
 */
export default function ChessBoard () {
  const [board, setBoard] = useState<Board>(initBoard)

  /** Replace one square, leaving the rest of the board's identities intact. */
  const setSquare = useCallback((row: number, col: number, piece: Piece) => {
    setBoard(board => board.map((squares, r) => (
      r === row
        ? squares.map((square, c) => (c === col ? piece : square))
        : squares
    )))
  }, [])

  const shouldAcceptDrop = useCallback((payload: Payload, rowIndex: number, colIndex: number) => {
    const { rowIndex: fromRow, colIndex: fromCol } = payload

    // dropping back where it came from
    if (fromRow === rowIndex && fromCol === colIndex) {
      return true
    }

    return board[fromRow][fromCol].side !== board[rowIndex][colIndex].side
  }, [board])

  const onDrop = useCallback((dropResult: DropResult, rowIndex: number, colIndex: number) => {
    const { addedIndex, removedIndex, payload } = dropResult

    if (removedIndex !== null) {
      setSquare(rowIndex, colIndex, {})
    }

    if (addedIndex !== null) {
      setSquare(rowIndex, colIndex, { ...(payload as Payload).piece, hover: false })
    }
  }, [setSquare])

  const setHover = useCallback((row: number, col: number, hover: boolean) => {
    setBoard(board => board.map((squares, r) => (
      r === row
        ? squares.map((square, c) => (c === col ? { ...square, hover } : square))
        : squares
    )))
  }, [])

  const renderPiece = (piece: Piece) => {
    if (!piece.side) {
      return null
    }

    const htmlcode = `&#${piece.data! + (piece.side === 'black' ? 6 : 0)};`
    const hover = piece.hover ? ' hover' : ''

    return (
      <Draggable>
        <div className={`piece${hover} ${piece.side}`}>
          <span dangerouslySetInnerHTML={{ __html: htmlcode }}></span>
        </div>
      </Draggable>
    )
  }

  return (
    <div className="board">
      {board.map((row, rowIndex) => (
        <div className="row" key={rowIndex}>
          {row.map((piece, colIndex) => (
            <div
              className={`square ${(rowIndex + colIndex) % 2 === 0 ? 'white' : 'black'}`}
              key={`${rowIndex}${colIndex}`}
            >
              <Container
                style={{ height: '100%' }}
                behaviour="drop-zone"
                onDrop={result => onDrop(result, rowIndex, colIndex)}
                shouldAcceptDrop={(_, payload) => shouldAcceptDrop(payload, rowIndex, colIndex)}
                getChildPayload={() => ({ colIndex, rowIndex, piece })}
                onDragEnter={() => setHover(rowIndex, colIndex, true)}
                onDragLeave={() => setHover(rowIndex, colIndex, false)}
              >
                {renderPiece(piece)}
              </Container>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

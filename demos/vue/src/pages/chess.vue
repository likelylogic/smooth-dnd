<template>
  <div class="board">
    <div v-for="(row, rowIndex) in board" :key="rowIndex" class="row">
      <div
        v-for="(piece, colIndex) in row"
        :key="`${rowIndex}${colIndex}`"
        :class="['square', (rowIndex + colIndex) % 2 === 0 ? 'white' : 'black']"
      >
        <Container
          style="height: 100%"
          behaviour="drop-zone"
          :should-accept-drop="(_source, payload) => shouldAcceptDrop(payload, rowIndex, colIndex)"
          :get-child-payload="() => ({ colIndex, rowIndex, piece })"
          @drop="onDrop($event, rowIndex, colIndex)"
          @drag-enter="onDragEnter(rowIndex, colIndex)"
          @drag-leave="onDragLeave(rowIndex, colIndex)"
        >
          <Draggable v-if="piece.side">
            <div :class="['piece', { hover: piece.hover }, piece.side]">
              <span>{{ glyph(piece) }}</span>
            </div>
          </Draggable>
        </Container>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Container, Draggable } from '@likelylogic/vue-smooth-dnd'
import type { DragResult } from '@demo/shared'

type Side = 'black' | 'white'

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
  return Array.from({ length: 8 }, () => ({ type: 'pawn', side, data: 9817 }))
}

function initBoard (): Piece[][] {
  const board: Piece[][] = []
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
      board.push([{}, {}, {}, {}, {}, {}, {}, {}])
    }
  }
  return board
}

const board = ref<Piece[][]>(initBoard())

/** The unicode chess glyph for a piece; black pieces sit 6 code points on. */
function glyph (piece: Piece) {
  return String.fromCharCode(piece.data! + (piece.side === 'black' ? 6 : 0))
}

/** Only allow a drop onto an empty square, or one holding an opponent's piece. */
function shouldAcceptDrop (payload: unknown, rowIndex: number, colIndex: number) {
  const { colIndex: fromCol, rowIndex: fromRow } = payload as Payload
  const fromPiece = board.value[fromRow][fromCol]
  const piece = board.value[rowIndex][colIndex]

  if (fromPiece === piece) {
    return true
  }
  if (fromPiece.side === piece.side) {
    return false
  }

  return true
}

function onDrop (dropResult: DragResult, rowIndex: number, colIndex: number) {
  const { addedIndex, removedIndex, payload } = dropResult

  if (addedIndex !== null || removedIndex !== null) {
    if (removedIndex !== null) {
      board.value[rowIndex][colIndex] = {}
    }

    if (addedIndex !== null) {
      board.value[rowIndex][colIndex] = (payload as Payload).piece
    }
  }
}

function onDragEnter (row: number, col: number) {
  board.value[row][col].hover = true
}

function onDragLeave (row: number, col: number) {
  board.value[row][col].hover = false
}
</script>

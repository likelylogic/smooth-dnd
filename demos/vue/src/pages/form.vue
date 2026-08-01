<template>
  <div class="form-demo">
    <div class="form">
      <Container
        @drop="onDrop($event)"
        non-drag-area-selector=".field"
        drag-class="form-ghost"
        drop-class="form-ghost-drop"
        :class="{isActive: true}"
      >
        <Draggable v-for="field in form" :key="field.type">
          <div
            class="form-line"
          >
            <div class="label">
              <span>{{field.label}}</span>
            </div>
            <div class="field">
              <h2 v-if="field.type === 'header'" class="field">
                Form Header
              </h2>
              <div v-if="field.type === 'fullname'" class="field-group">
                <input type="text"/><input type="text"/>
              </div>
              <div v-if="field.type === 'email'" class="field">
                <input type="email"/>
              </div>
              <div v-if="field.type === 'address'" class="field">
                <textarea></textarea>
              </div>
              <div v-if="field.type === 'dropdown'" class="field">
                <select>
                  <option value="1">Option 1</option>
                  <option value="2" selected>Option 2</option>
                  <option value="3">Option 3</option>
                  <option value="4">Option 4</option>
                </select>
              </div>
              <div v-if="field.type === 'checkbox'" class="field">
                <div><label><input type="checkbox" name="r"/> option 1</label></div>
                <div><label><input type="checkbox" name="r"/> option 2</label></div>
                <div><label><input type="checkbox" name="r"/> option 3</label></div>
                <div><label><input type="checkbox" name="r"/> option 4</label></div>
                <div><label><input type="checkbox" name="r"/> option 5</label></div>
              </div>
              <div v-if="field.type === 'radio'" class="field">
                <div><label><input type="radio" name="r"/> option 1</label></div>
                <div><label><input type="radio" name="r"/> option 2</label></div>
                <div><label><input type="radio" name="r"/> option 3</label></div>
                <div><label><input type="radio" name="r"/> option 4</label></div>
                <div><label><input type="radio" name="r"/> option 5</label></div>
              </div>
              <div v-if="field.type === 'submit'" class="field">
                <button class="form-submit-button">Submit</button>
              </div>
            </div>
          </div>
        </Draggable>
      </Container>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Container, Draggable } from '@likelylogic/vue-smooth-dnd'
import { applyDrag, type DragResult } from '@demo/shared'

interface Field {
  type: string
  label?: string
}

const formInitial: Field[] = [
  { type: 'header' },
  { type: 'fullname', label: 'Full Name' },
  { type: 'email', label: 'E Mail' },
  { type: 'address', label: 'Address' },
  { type: 'dropdown', label: 'Options' },
  { type: 'checkbox', label: 'Checkbox Options' },
  { type: 'radio', label: 'Radio Options' },
  { type: 'submit' },
]

const form = ref<Field[]>([...formInitial])

function onDrop (dropResult: DragResult) {
  form.value = applyDrag(form.value, dropResult)
}
</script>

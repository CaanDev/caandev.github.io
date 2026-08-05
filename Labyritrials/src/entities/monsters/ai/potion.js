/**
 * @fileoverview Использование зелий монстрами
 * @module entities/monsters/ai/potion
 */

import { state } from '../../../core/config/index.js';
import { COLORS } from '../../../core/config/colors.js';
import { hasLineOfSight } from '../../../world/physics.js';

/**
 * Поиск и использование зелья монстром
 * 
 * @param {Object} m - Объект монстра
 * @returns {boolean} - true, если зелье использовано
 */
export function usePotionIfNearby(m) {
  if (m.state !== 'chase') return false;
  if (state.isBossLevel) return false;
  if (m.isBoss || m.isDuoBoss) return false;
  
  const potionRadius = 120;
  let nearestPotion = null;
  let nearestDist = Infinity;
  
  for (let item of state.lootItems) {
    if (item.type !== 'potion') continue;
    
    const dist = Math.hypot(m.x - item.x, m.y - item.y);
    if (dist < potionRadius && dist < nearestDist) {
      if (hasLineOfSight(m.x, m.y, item.x, item.y)) {
        nearestPotion = item;
        nearestDist = dist;
      }
    }
  }
  
  if (!nearestPotion) return false;
  
  const distToPotion = Math.hypot(m.x - nearestPotion.x, m.y - nearestPotion.y);
  if (distToPotion < 35) {
    const index = state.lootItems.indexOf(nearestPotion);
    if (index !== -1) state.lootItems.splice(index, 1);

    const isFullHp = m.hp >= m.maxHp;
    
    if (isFullHp) {
      state.damageTexts.push({
        x: m.x,
        y: m.y - 20,
        text: `❤️ Здоровье полное!`,
        color: COLORS.ui.textGold,
        size: 18,
        life: 50,
        speedy: 1.0
      });
      
      for (let i = 0; i < 6; i++) {
        const angle2 = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2;
        state.sparks.push({
          x: m.x,
          y: m.y,
          vx: Math.cos(angle2) * speed,
          vy: Math.sin(angle2) * speed - 0.5,
          life: 10 + Math.random() * 10,
          maxLife: 20,
          size: 1.5 + Math.random() * 2.5,
          color: COLORS.ui.textGold,
          gravity: 0.03,
          isDust: false
        });
      }
      return true;
    }
    
    const healPercent = 0.3 + Math.random() * 0.15;
    const healAmount = Math.floor(m.maxHp * healPercent);
    const oldHp = m.hp;
    m.hp = Math.min(m.maxHp, m.hp + healAmount);
    const actualHeal = m.hp - oldHp;
    
    state.damageTexts.push({
      x: m.x,
      y: m.y - 20,
      text: `+${actualHeal} ❤️`,
      color: COLORS.effects.potion.mid,
      size: 24,
      life: 50,
      speedy: 1.2
    });
    
    for (let i = 0; i < 12; i++) {
      const angle2 = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      state.sparks.push({
        x: m.x,
        y: m.y,
        vx: Math.cos(angle2) * speed,
        vy: Math.sin(angle2) * speed - 1,
        life: 15 + Math.random() * 15,
        maxLife: 30,
        size: 2 + Math.random() * 4,
        color: COLORS.effects.potion.mid,
        gravity: 0.05,
        isDust: false
      });
    }
    
    m.trapGlowColor = COLORS.effects.potion.mid;
    m.trapGlowTimer = 30;
    return true;
  }
  
  const angle = Math.atan2(nearestPotion.y - m.y, nearestPotion.x - m.x);
  const moveSpeed = m.speed * 1.8;
  m.x += Math.cos(angle) * moveSpeed;
  m.y += Math.sin(angle) * moveSpeed;
  return false;
}
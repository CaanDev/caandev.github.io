/**
 * @fileoverview Форматирование чисел с разделением на разряды
 * @module utils/formatNumber
 */

/**
 * Форматирование числа с разделением на разряды (пробелы)
 * 
 * @param {number|string} value - Число для форматирования
 * @returns {string} - Отформатированное число
 * 
 * @example
 * formatNumber(1234)     // "1 234"
 * formatNumber(1234567)  // "1 234 567"
 * formatNumber(0)        // "0"
 * formatNumber(1234.56)  // "1 234.56"
 */
export function formatNumber(value) {
  // Защита от null/undefined
  if (value === null || value === undefined) return '0';
  // Преобразование в число
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  // Проверка на NaN
  if (isNaN(num)) return '0';
  
  // Разделение целой и дробной части
  const parts = String(num).split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '';
  
  // Форматирование целой части с разделением на разряды
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  // Возвращение с дробной частью, если она есть
  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}
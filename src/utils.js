const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

const emojis = [":man_mage:", ":woman_mage:", ":crossed_swords:", ":boom:", ":fire:"];
const emoji = () => getRandomElement(emojis);

module.exports = { getRandomElement, emoji };

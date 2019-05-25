// @flow
const defaultFallback = require('./Requests/default_fallback.json');
const fightClub = require('./Requests/fight_club.json');
const noMovie = require('./Requests/no_movie.json');
const confirm = require('./Requests/oui.json');
const budget = require('./Requests/budget.json');
const summary = require('./Requests/summary.json');
const note = require('./Requests/note.json');
const changeMovie = require('./Requests/change_movie.json');
const possibleQuestions = require('./Requests/possible_questions.json');

module.exports = {
  defaultFallback,
  fightClub,
  noMovie,
  confirm,
  budget,
  summary,
  note,
  changeMovie,
  possibleQuestions,
};

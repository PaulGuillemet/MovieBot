// @flow
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const https = require('https');

admin.initializeApp();

// Returns the id in MovieDb of the film with the name that best matches the string given in input
const getMovieId = function getMovieIdFromExternalAPI(nameToQuery) {
  const path = `https://api.themoviedb.org/3/search/movie?query=${nameToQuery}&api_key=ba45a45375e8ef08fe8ec6ff5c27ceb5&language=fr`;
  return new Promise((resolve, reject) => {
    https.get(path, (res) => {
      let body = '';
      res.on('data', (d) => { body += d; });
      res.on('end', () => {
        const response = JSON.parse(body);
        if (response != null
            && Object.prototype.hasOwnProperty.call(response, 'results')
            && Object.prototype.hasOwnProperty.call(response.results, 'length')
            && response.results.length > 0) {
          resolve(response.results[0].id);
        } else {
          reject();
        }
      });
    }).on('error', () => {
      reject();
    });
  });
};

// Returns infos about the movie with the name that best matches the string given in input
const getMovieInfo = function getMovieInfoFromExternalAPI(nameToQuery) {
  return new Promise((resolve, reject) => {
    getMovieId(nameToQuery).then((id) => {
      const path = `https://api.themoviedb.org/3/movie/${id}?api_key=ba45a45375e8ef08fe8ec6ff5c27ceb5&language=fr`;
      https.get(path, (res) => {
        let body = '';
        res.on('data', (d) => { body += d; });
        res.on('end', () => {
          const response = JSON.parse(body);
          if (response != null && Object.prototype.hasOwnProperty.call(response, 'id')) {
            resolve(response);
          } else {
            reject();
          }
        });
      }).on('error', () => {
        reject();
      });
    }).catch(() => {
      reject();
    });
  });
};

// EntryPoint
exports.dialogflowFirebaseFulfillment = functions.https.onRequest(async (req, res) => {
  const { session } = req.body;
  const intent = req.body.queryResult.intent.displayName;
  const text = req.body.queryResult.queryText;
  const db = await admin.database().ref(`/${session}`);

  const done = new Promise((resolve, reject) => {
    // We look in the db to get the context
    db.once('value', (snapshot) => {
      // First input received
      if (snapshot.val() === null) {
        /**
        * I will not wait for the db insertions to be finished to let the bot
        * respond because i am asuming the insertions will be done by the time
        * the next user input is received
        */
        db.set({ currentMovie: {}, set: false, confirmed: false });
        resolve('Bonjour, je suis un bot conçu pour vous renseigner sur les films.\nQuel est le titre du film sur lequel vous souhaitez obternir des informations?');
      // When we don't know which movie yet
      } else if (!snapshot.val().set) {
        // Trying to find a movie matching the user input
        getMovieInfo(text).then((response) => {
          db.set({ currentMovie: response, set: true, confirmed: false });
          resolve(`Le film ${response.title} sorti en ${(response.release_date).split('-')[0]}?`);
        }).catch(() => {
          resolve('Je n\'ai pas trouvé de film avec ce titre. Quel est le titre exact du film?');
        });
      // When the bot just asked a confirmation
      } else if (!snapshot.val().confirmed) {
        if (intent === 'Oui') {
          db.set({ currentMovie: snapshot.val().currentMovie, set: true, confirmed: true });
          resolve('Parfait, que voulez-vous savoir sur ce film?');
        } else {
          db.set({ currentMovie: {}, set: false, confirmed: false });
          resolve('Ah, de quel film voulez vous parlez alors?');
        }
      // Once the user has confirmed which movie he wants infos on
      } else {
        switch (intent) {
          // When the user asks what the movie is about
          case ('Summary'): {
            if (snapshot.val().currentMovie.overview) {
              resolve(snapshot.val().currentMovie.overview);
            } else {
              resolve('Désolé, je ne sais pas de quoi parle ce film.');
            }
            break;
          }
          // When the user asks the budget of the film
          case ('Budget'): {
            if (snapshot.val().currentMovie.budget) {
              resolve(`Le film a couté environ ${snapshot.val().currentMovie.budget}$.`);
            } else {
              resolve('Désolé, je ne connais pas le budget de ce film.');
            }
            break;
          }
          // When the user asks it's a good movie
          case ('Note'): {
            if (snapshot.val().currentMovie.vote_average) {
              resolve(`Le film a été noté ${snapshot.val().currentMovie.vote_average}/10 par les spectateurs.`);
            } else {
              resolve('Désolé, je n\'ai pas d\'avis spectateur pour ce film.');
            }
            break;
          }
          // When the user wants to know what to ask
          case ('PossibleQuestions'): {
            resolve('Vous pouvez me demander le budget, la note spectateur, ou le sujet de ce film.');
            break;
          }
          // When the user says he wants to talk about another movie
          case ('ChangeMovie'): {
            db.set({ currentMovie: {}, set: false, confirmed: false });
            resolve('Quel est le titre du film?');
            break;
          }
          default: {
            resolve('Je regrette mais je ne comprends pas, peut etre pourriez vous formuler autrement votre demande.');
          }
        }
      }
    // Error case
    }, () => {
      reject();
    });
  });

  done.then((resp) => {
    res.json({ fulfillmentText: resp });
  }).catch(() => {
    res.json({ fulfillmentText: 'Veuillez m\'excuser mais il semble que j\'ai perdu mon cerveau, réessayez plus tard.' });
  });
});

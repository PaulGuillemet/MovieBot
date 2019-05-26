// @flow
const { describe, it } = require('mocha');
const assert = require('assert');
const admin = require('firebase-admin');
const sinon = require('sinon');
const myFunctions = require('../index.js');
const req = require('./req.js');
const movieInfos = require('./movie_infos.js');


// Mocking the firebase db functions
const databaseStub: Object = sinon.stub();
const refStub: Object = sinon.stub();
let dbReturn: Object = null;
let mockDB = function mockDatabase(str: string, cb: Function): void {
  cb({ val: () => dbReturn });
};
refStub.returns({ once: mockDB, set: () => {} });
databaseStub.returns({ ref: refStub });
Object.defineProperty(admin, 'database', { value: databaseStub });

// Doing tests
describe('Database not initialized', () => {
  it('Return introduction sentence when db is null', (done) => {
    dbReturn = null;
    const resMock: Object = {
      json: (response: Object) => {
        assert.equal(response.fulfillmentText, 'Bonjour, je suis un bot conçu pour vous renseigner sur les films.\nQuel est le titre du film sur lequel vous souhaitez obternir des informations?');
        done();
      },
    };
    myFunctions.dialogflowFirebaseFulfillment(req.defaultFallback, resMock);
  });
});

describe('Movie not set', () => {
  it('User gives a string that matches a movie name', (done) => {
    dbReturn = { currentMovie: {}, set: false, confirmed: false };
    const resMock: Object = {
      json: (response: Object) => {
        assert.equal(response.fulfillmentText, 'Le film Fight Club sorti en 1999?');
        done();
      },
    };
    myFunctions.dialogflowFirebaseFulfillment(req.fightClub, resMock);
  });

  it('User gives a string that matches no movie name', (done) => {
    dbReturn = { currentMovie: {}, set: false, confirmed: false };
    const resMock: Object = {
      json: (response: Object) => {
        assert.equal(response.fulfillmentText, 'Je n\'ai pas trouvé de film avec ce titre. Quel est le titre exact du film?');
        done();
      },
    };
    myFunctions.dialogflowFirebaseFulfillment(req.noMovie, resMock);
  });
});

describe('Movie set but not confirmed', () => {
  it('User confirms', (done) => {
    dbReturn = { currentMovie: movieInfos.fightClub, set: true, confirmed: false };
    const resMock: Object = {
      json: (response: Object) => {
        assert.equal(response.fulfillmentText, 'Parfait, que voulez-vous savoir sur ce film?');
        done();
      },
    };
    myFunctions.dialogflowFirebaseFulfillment(req.confirm, resMock);
  });

  it('User does not confirm', (done) => {
    dbReturn = { currentMovie: movieInfos.fightClub, set: true, confirmed: false };
    const resMock: Object = {
      json: (response: Object) => {
        assert.equal(response.fulfillmentText, 'Ah, de quel film voulez vous parlez alors?');
        done();
      },
    };
    myFunctions.dialogflowFirebaseFulfillment(req.defaultFallback, resMock);
  });
});

describe('Movie is set and confirmed', () => {
  it('User asks the budget', (done) => {
    dbReturn = { currentMovie: movieInfos.fightClub, set: true, confirmed: true };
    const resMock: Object = {
      json: (response: Object) => {
        assert.equal(response.fulfillmentText, 'Le film a couté environ 63000000$.');
        done();
      },
    };
    myFunctions.dialogflowFirebaseFulfillment(req.budget, resMock);
  });

  it('User asks the budget but this info is not available', (done) => {
    dbReturn = { currentMovie: movieInfos.noInfos, set: true, confirmed: true };
    const resMock: Object = {
      json: (response: Object) => {
        assert.equal(response.fulfillmentText, 'Désolé, je ne connais pas le budget de ce film.');
        done();
      },
    };
    myFunctions.dialogflowFirebaseFulfillment(req.budget, resMock);
  });

  it('User asks the summary', (done) => {
    dbReturn = { currentMovie: movieInfos.fightClub, set: true, confirmed: true };
    const resMock: Object = {
      json: (response: Object) => {
        assert.equal(response.fulfillmentText, 'Le narrateur, sans identité précise, vit seul, travaille seul, dort seul, mange seul ses plateaux-repas pour une personne comme beaucoup d’autres personnes seules qui connaissent la misère humaine, morale et sexuelle. C’est pourquoi il va devenir membre du Fight club, un lieu clandestin où il va pouvoir retrouver sa virilité, l’échange et la communication. Ce club est dirigé par Tyler Durden, une sorte d’anarchiste entre gourou et philosophe qui prêche l’amour de son prochain.');
        done();
      },
    };
    myFunctions.dialogflowFirebaseFulfillment(req.summary, resMock);
  });

  it('User asks the summary but this info is not available', (done) => {
    dbReturn = { currentMovie: movieInfos.noInfos, set: true, confirmed: true };
    const resMock: Object = {
      json: (response: Object) => {
        assert.equal(response.fulfillmentText, 'Désolé, je ne sais pas de quoi parle ce film.');
        done();
      },
    };
    myFunctions.dialogflowFirebaseFulfillment(req.summary, resMock);
  });

  it('User asks how the movie was rated', (done) => {
    dbReturn = { currentMovie: movieInfos.fightClub, set: true, confirmed: true };
    const resMock: Object = {
      json: (response: Object) => {
        assert.equal(response.fulfillmentText, 'Le film a été noté 8.4/10 par les spectateurs.');
        done();
      },
    };
    myFunctions.dialogflowFirebaseFulfillment(req.note, resMock);
  });

  it('User asks how the movie was rated but this info is not available', (done) => {
    dbReturn = { currentMovie: movieInfos.noInfos, set: true, confirmed: true };
    const resMock: Object = {
      json: (response: Object) => {
        assert.equal(response.fulfillmentText, 'Désolé, je n\'ai pas d\'avis spectateur pour ce film.');
        done();
      },
    };
    myFunctions.dialogflowFirebaseFulfillment(req.note, resMock);
  });

  it('User wants to talk about another movie', (done) => {
    dbReturn = { currentMovie: movieInfos.fightClub, set: true, confirmed: true };
    const resMock: Object = {
      json: (response: Object) => {
        assert.equal(response.fulfillmentText, 'Quel est le titre du film?');
        done();
      },
    };
    myFunctions.dialogflowFirebaseFulfillment(req.changeMovie, resMock);
  });

  it('User wants to know what to ask', (done) => {
    dbReturn = { currentMovie: movieInfos.fightClub, set: true, confirmed: true };
    const resMock: Object = {
      json: (response: Object) => {
        assert.equal(response.fulfillmentText, 'Vous pouvez me demander le budget, la note spectateur, ou le sujet de ce film.');
        done();
      },
    };
    myFunctions.dialogflowFirebaseFulfillment(req.possibleQuestions, resMock);
  });

  it('Cannot understand what the user wants', (done) => {
    dbReturn = { currentMovie: movieInfos.fightClub, set: true, confirmed: true };
    const resMock: Object = {
      json: (response: Object) => {
        assert.equal(response.fulfillmentText, 'Je regrette mais je ne comprends pas, peut etre pourriez vous formuler autrement votre demande.');
        done();
      },
    };
    myFunctions.dialogflowFirebaseFulfillment(req.defaultFallback, resMock);
  });
});

describe('An error is thrown during process', () => {
  it('On error in promise', (done) => {
    dbReturn = { currentMovie: {}, set: false, confirmed: false };
    // To generate an error
    refStub.returns(null);
    const resMock: Object = {
      json: (response: Object) => {
        assert.equal(response.fulfillmentText, 'Veuillez m\'excuser mais il semble que j\'ai perdu mon cerveau, réessayez plus tard.');
        done();
      },
    };
    myFunctions.dialogflowFirebaseFulfillment(req.noMovie, resMock);
  });

  it('On error return of db.once ', (done) => {
    dbReturn = { currentMovie: {}, set: false, confirmed: false };
    // Throwing an error like the db.once function would do
    mockDB = function mockDatabase(str: string, cb: Function, cb2: Function) {
      cb2();
    };
    refStub.returns({ once: mockDB, set: () => {} });
    const resMock: Object = {
      json: (response: Object) => {
        assert.equal(response.fulfillmentText, 'Veuillez m\'excuser mais il semble que j\'ai perdu mon cerveau, réessayez plus tard.');
        done();
      },
    };
    myFunctions.dialogflowFirebaseFulfillment(req.defaultFallback, resMock);
  });
});

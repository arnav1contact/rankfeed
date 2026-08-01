import { mockItemPools as pools } from './item-pools';
import type { RankingTemplate } from './types';

export const mockRankingTemplates = [
  { id: 'template-ice-cream-01', format: 'blind-ranking', title: 'Blind rank these ice cream flavors', topic: 'Food', description: 'Five random flavors from a pool of eighteen.', items: pools.iceCream, uses: 28400 },
  { id: 'template-fast-food-01', format: 'blind-ranking', title: 'Fast-food fries showdown', topic: 'Food', description: 'Five chains, revealed one fry at a time.', items: pools.fries, uses: 19200 },
  { id: 'template-albums-01', format: 'blind-ranking', title: 'Blind rank these classic albums', topic: 'Music', description: 'A different five-album draw every time.', items: pools.albums, uses: 33800 },
  { id: 'template-travel-01', format: 'blind-ranking', title: 'Dream city weekend', topic: 'Travel', description: 'Rank five surprise city breaks.', items: pools.travel, uses: 12100 },
  { id: 'template-pizza-01', format: 'blind-ranking', title: 'Pizza toppings under pressure', topic: 'Food', description: 'No changing a slot after the next topping appears.', items: pools.pizza, uses: 26900 },
  { id: 'template-superpowers-01', format: 'blind-ranking', title: 'Which superpower would you take?', topic: 'Culture', description: 'Five random powers and only five permanent slots.', items: pools.superpowers, uses: 48300 },
  { id: 'template-coffee-01', format: 'blind-ranking', title: 'Blind rank the coffee order', topic: 'Food', description: 'Cafe favorites arrive in a random order.', items: pools.coffee, uses: 15700 },
  { id: 'template-game-characters-01', format: 'blind-ranking', title: 'Most iconic game characters', topic: 'Gaming', description: 'Build a top five without seeing who comes next.', items: pools.gameCharacters, uses: 31600 },
  { id: 'template-weapons-01', format: 'bracket', title: 'Greatest mythical weapon', topic: 'Mythology', description: 'Eight random legendary weapons enter.', items: pools.mythicalWeapons, uses: 41700 },
  { id: 'template-sitcom-01', format: 'bracket', title: 'Ultimate comfort sitcom', topic: 'TV', description: 'A fresh eight-show bracket each run.', items: pools.sitcoms, uses: 24600 },
  { id: 'template-snacks-01', format: 'bracket', title: 'Best movie-night snack', topic: 'Food', description: 'Sweet and salty favorites compete.', items: pools.snacks, uses: 30900 },
  { id: 'template-heroes-01', format: 'bracket', title: 'Ultimate superhero showdown', topic: 'Culture', description: 'Eight heroes sampled from a field of sixteen.', items: pools.heroes, uses: 55200 },
  { id: 'template-vacations-01', format: 'bracket', title: 'Perfect vacation bracket', topic: 'Travel', description: 'Pick your ideal escape one matchup at a time.', items: pools.vacations, uses: 18400 },
  { id: 'template-chains-01', format: 'bracket', title: 'Fast-food chain champion', topic: 'Food', description: 'Eight chains enter; one survives.', items: pools.fastFood, uses: 39700 },
  { id: 'template-board-games-01', format: 'bracket', title: 'Board game night champion', topic: 'Games', description: 'A randomized tabletop tournament.', items: pools.boardGames, uses: 14300 },
  { id: 'template-animals-01', format: 'bracket', title: 'Animal kingdom face-off', topic: 'Nature', description: 'Choose your champion from eight random animals.', items: pools.animals, uses: 22100 },
  { id: 'template-pokemon-games-01', format: 'completed-result', title: 'My Pokemon game top five', topic: 'Gaming', description: 'Share your definitive top five games.', items: pools.pokemonGames, uses: 22100 },
  { id: 'template-breakfast-01', format: 'completed-result', title: 'Breakfast foods, ranked', topic: 'Food', description: 'Build the breakfast table of champions.', items: pools.breakfast, uses: 17800 },
  { id: 'template-movies-01', format: 'completed-result', title: 'Top five animated movies', topic: 'Movies', description: 'Your personal animation hall of fame.', items: pools.animatedMovies, uses: 35200 },
  { id: 'template-sneakers-01', format: 'completed-result', title: 'Greatest sneakers ever made', topic: 'Style', description: 'Build your all-time footwear top five.', items: pools.sneakers, uses: 20700 },
  { id: 'template-desserts-01', format: 'completed-result', title: 'Dessert hall of fame', topic: 'Food', description: 'Five sweets make your final table.', items: pools.desserts, uses: 28600 },
  { id: 'template-games-01', format: 'completed-result', title: 'My all-time video game top five', topic: 'Gaming', description: 'Publish your definitive gaming list.', items: pools.videoGames, uses: 44100 },
  { id: 'template-streaming-01', format: 'completed-result', title: 'Best streaming shows', topic: 'TV', description: 'Choose the five series everyone should watch.', items: pools.streamingShows, uses: 25300 },
  { id: 'template-sandwiches-01', format: 'completed-result', title: 'The sandwich top five', topic: 'Food', description: 'Construct your perfect sandwich leaderboard.', items: pools.sandwiches, uses: 16600 },
] as const satisfies readonly RankingTemplate[];

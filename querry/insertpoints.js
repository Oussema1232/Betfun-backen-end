module.exports = function (querryparams) {
  let q = "";
  for (let i = 0; i < querryparams.length; i++) {
    q += `UPDATE bets SET points=${querryparams[i].guesspoints} WHERE id=${querryparams[i].idBet};`;
  }
  return q;
};

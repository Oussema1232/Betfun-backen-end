module.exports = function (querryparams, idBet) {
  let q = "";
  for (let i = 0; i < querryparams.length; i++) {
    q += ` UPDATE betdetails SET guess=${querryparams[i].guess} WHERE idMatch=${querryparams[i].idMatch} AND idBet=${idBet};`;
  }
  return q;
};



//get fixtures of specific team

getFixturesTeam = (req, res) => {
  const q = `
      SELECT CONCAT(teams1.name," vs ",teams2.name) AS matchs,
             played_on,
             cote_1,
             cote_2,
             cote_x
      FROM calendar_results
      JOIN teams AS teams1
      ON teams1.id=team1Id
      JOIN teams AS teams2
      ON teams2.id=team2Id
      WHERE team1Id=${req.body.teamId} OR team2Id=${req.body.teamId} AND bingo IS NULL;
      `;
  connexion.query(q, (error, result) => {
    if (error) return res.status(500).json(error);
    return res.status(200).json(result);
  });
};

//get matches played between two dates
getMatchDate = (res, req) => {
  const q = `
      SELECT teams1.name AS team1,teams2.name AS team2 FROM calendar_results
      JOIN teams AS teams1
      ON teams1.id=team1Id
      JOIN teams AS teams2
      ON teams2.id=team2Id
      WHERE cast(played_on AS datetime) BETWEEN cast(? as datetime) AND cast(? AS datetime);
      `;
  connexion.query(q, [req.body.date1, req.body.date2], (error, result) => {
    if (error) return res.status(500).json(error);
    return res.status(200).json(result);
  });
};

//get bets of a specific user at a specefic season
getBetsSeason = (req, res) => {
  const q = `
      SELECT * FROM bets 
      JOIN gameweeks 
      ON gameweekId=gameweeks.id
      WHERE userId=? AND gameweeks.season=?;
      `;
  connexion.query(q, [req.body.userId, req.body.season], (error, result) => {
    if (error) return res.status(500).json(error);
    return res.status(200).json(result);
  });
};

//get all points of a specific user at a specific season
getPoints = (req, res) => {
  const q = `
      Select username,SUM(points) AS total_points FROM bets
      JOIN gameweeks 
      ON gameweekId=gameweeks.id
      JOIN users
      ON userId=users.id
      WHERE userId=? AND gameweeks.season=?;
      `;
  connexion.query(q, [req.body.userId, req.body.season], (error, result) => {
    if (error) return res.status(500).json(error);
    return res.status(200).json(result);
  });
};

//get bets of a specific user at a specific gameweek at a specific season
getPointsGW = (req, res) => {
  const q = `
      SELECT * FROM bets 
      JOIN gameweeks 
      ON gameweekId=gameweeks.id
      WHERE userId=? AND gameweeks.gameweek=? AND gameweeks.season=?;
      `;
  connexion.query(
    q,
    [req.body.userId, req.body.gameweek, req.body.season],
    (error, result) => {
      if (error) return res.status(500).json(error);
      return res.status(200).json(result);
    }
  );
};

//order of users based on points at a specific gameweek at a specific season
rankGameweek = (req, res) => {
  const q = `
      Select username,points FROM bets
      JOIN gameweeks 
      ON gameweekId=gameweeks.id
      JOIN users
      ON userId=users.id
      WHERE gameweeks.gameweek=? AND gameweeks.season=?
      ORDER BY points DESC;
      `;
  connexion.query(q, [req.body.gameweek, req.body.season], (error, result) => {
    if (error) return res.status(500).json(error);
    return res.status(200).json(result);
  });
};

//order of users based on total of points at a specific season
rankSeason = (req, res) => {
  const q = `
      SELECT username,SUM(points) AS total_points FROM bets
      JOIN gameweeks 
      ON gameweekId=gameweeks.id 
      JOIN users
      ON userId=users.id
      WHERE gameweeks.season=1
      GROUP BY userId
      ORDER BY total_points DESC; 
      `;
  connexion.query(q, req.body.season, (error, result) => {
    if (error) return res.status(500).json(error);
    return res.status(200).json(result);
  });
};

//order of users based on total of points (all season)
rankAllSeason = (req, res) => {
  const q = `
      SELECT username,SUM(points) AS total_points FROM bets
      JOIN gameweeks 
      ON gameweekId=gameweeks.id 
      JOIN users
      ON userId=users.id
      GROUP BY userId
      ORDER BY total_points DESC; 
      `;
  connexion.query(q, (error, result) => {
    if (error) return res.status(500).json(error);
    return res.status(200).json(result);
  });
};

//order of users based on points on specific month at a specific season
rankMonth = (req, res) => {
  const q = `
      Select username,month_name,SUM(points) AS total_points FROM bets
      JOIN users
      ON userId=users.id
      JOIN gameweeks
      ON gameweeks.gameweek=bets.gameweekId
      WHERE month_name=? AND gameweeks.season=?
      GROUP BY userId,month_name
      ORDER BY points DESC;
      `;
  connexion.query(
    q,
    [req.body.month_name, req.body.season],
    (error, result) => {
      if (error) return res.status(500).json(error);
      return res.status(200).json(result);
    }
  );
};

//get bets of specific user at a specific season
betsSeason = (req, res) => {
  const q = `
      SELECT * FROM bets
      JOIN gameweeks
      ON gameweeks.gameweek=bets.gameweekId
      WHERE userId=? AND gameweeks.season=?;
      `;
  connexion.query(q, [req.body.userId, req.body.season], (error, result) => {
    if (error) return res.status(500).json(error);
    return res.status(200).json(result);
  });
};

//get bets of specific user (all season)
betsAllSeason = (req, res) => {
  const q = `
      SELECT * FROM bets
      JOIN gameweeks
      ON gameweeks.gameweek=bets.gameweekId
      WHERE userId=? ;
      `;
  connexion.query(q, req.body.userId, (error, result) => {
    if (error) return res.status(500).json(error);
    return res.status(200).json(result);
  });
};

//get all details of a specific bet
betDetails = (req, res) => {
  const q = `
      SELECT teams1.name AS team1,teams2.name AS team2,guess,bingo FROM betdetails
      JOIN calendar_results
      ON idMatch=calendar_results.id
      JOIN teams AS teams1
      ON teams1.id=team1Id
      JOIN teams AS teams2
      ON teams2.id=team2Id
      WHERE idBet=?;
      `;
  connexion.query(q, req.body.idBet, (error, result) => {
    if (error) return res.status(500).json(error);
    return res.status(200).json(result);
  });
};

//order of users in a specific league (and specific month) and specific season

rankLeagueMonth = (req, res) => {
  const q = `
      Select username,month_name,SUM(points) AS total_points FROM bets
      JOIN users
      ON bets.userId=users.id
      JOIN gameweeks
      ON gameweeks.gameweek=bets.gameweek
      JOIN user_league 
      ON user_league.userId=users.id
      WHERE month_name=? AND user_league.leagueId=? AND gameweeks.season=?
      GROUP BY bets.userId,month_name
      ORDER BY points DESC;
      `;
  connexion.query(
    q,
    [req.body.month_name, req.body.leagueId, req.body.deason],
    (error, result) => {
      if (error) return res.status(500).json(error);
      return res.status(200).json(result);
    }
  );
};

//order of users in a specific league  and specific season

rankLeagueMonth = (req, res) => {
  const q = `
      Select username,month_name,SUM(points) AS total_points FROM bets
      JOIN users
      ON bets.userId=users.id
      JOIN gameweeks
      ON gameweeks.gameweek=bets.gameweek
      JOIN user_league 
      ON user_league.userId=users.id
      WHERE  user_league.leagueId=? AND gameweeks.season=?
      GROUP BY bets.userId,month_name
      ORDER BY points DESC;
      `;
  connexion.query(q, [req.body.leagueId, req.body.deason], (error, result) => {
    if (error) return res.status(500).json(error);
    return res.status(200).json(result);
  });
};

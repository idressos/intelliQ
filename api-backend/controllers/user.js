const { Parser } = require(`json2csv`);

const errors = require(`../errors`);
const pool = require(`../services/database`);

/*
    Endpoint Implementation
    Resource URL: /questionnaire/:questionnaireID
    Supported Methods: GET

    Returns the details and questions of a questionnaire
*/
exports.questionnaire = async (req, res, next) => {
    if(!req.params.questionnaireID) {
        return next(new errors.UsageError(`Missing parameter: questionnaireID`, 400));
    }

    let conn, resdata;

    try {
        conn = await pool.getConnection();

        const questionnaire = (await conn.query(`SELECT * FROM questionnaires WHERE questionnaireID = ?;`, [req.params.questionnaireID]))[0];

        if(questionnaire) {
            const keywords = (await conn.query(`SELECT k.keywordText FROM keywords k INNER JOIN questionnaire_keywords qk ON k.keywordID = qk.keywordID WHERE questionnaireID = ? ORDER BY k.keywordText ASC;`, [req.params.questionnaireID]));
            const questions = (await conn.query(`SELECT qID, qtext, required, type FROM questions WHERE questionnaireID = ? ORDER BY qID ASC;`, [req.params.questionnaireID]));

            resdata = questionnaire;
            resdata.keywords = keywords.map(keyword => keyword.keywordText);
            resdata.questions = questions;
        }
    } catch(err) {
        return next(err);
    } finally {
        if(resdata) {
            if(req.query.format == `csv`) {
                resdata.keywords = resdata.keywords.join(`, `);

                for(question in resdata.questions) {
                    resdata.questions[question] = {...resdata, ...resdata.questions[question]};
                    delete resdata.questions[question].questions;
                }

                const parser = new Parser(Object.keys(resdata.questions));

                res.type(`text/csv`);
                res.send(parser.parse(resdata.questions));
            } else {
                res.status(200).json(resdata);
            }
        } else res.status(204).send();

        if(conn) conn.end();
    }
};

/*
    Endpoint Implementation
    Resource URL: /questionnaires
    Supported Methods: GET

    Returns the details of all questionnaires
*/
exports.questionnaires = async (req, res, next) => {
    let conn, resdata;

    try {
        conn = await pool.getConnection();

        let questionnaires;
        if(req.query.keyword) {
            if(Array.isArray(req.query.keyword)) questionnaires = (await conn.query(`SELECT DISTINCT q.questionnaireID, q.questionnaireTitle FROM questionnaires q INNER JOIN questionnaire_keywords qk ON q.questionnaireID = qk.questionnaireID INNER JOIN keywords k ON qk.keywordID = k.keywordID WHERE k.keywordText IN (?);`, [req.query.keyword]));
            else questionnaires = (await conn.query(`SELECT q.questionnaireID, q.questionnaireTitle FROM questionnaires q INNER JOIN questionnaire_keywords qk ON q.questionnaireID = qk.questionnaireID INNER JOIN keywords k ON qk.keywordID = k.keywordID WHERE k.keywordText = ?;`, [req.query.keyword]));
        } else questionnaires = (await conn.query(`SELECT * FROM questionnaires;`));

        if(questionnaires.length > 0) resdata = questionnaires;
    } catch(err) {
        return next(err);
    } finally {
        if(resdata) {
            if(req.query.format == `csv`) {
                const parser = new Parser(Object.keys(resdata));

                res.type(`text/csv`);
                res.send(parser.parse(resdata));
            } else {
                res.status(200).json(resdata);
            }
        } else res.status(204).send();

        if(conn) conn.end();
    }
};

/*
    Endpoint Implementation
    Resource URL: /keywords
    Supported Methods: GET

    Returns the details of all keywords
*/
exports.keywords = async (req, res, next) => {
    let conn, resdata;

    try {
        conn = await pool.getConnection();

        const keywords = (await conn.query(`SELECT * FROM keywords;`));

        if(keywords.length > 0) resdata = keywords;
    } catch(err) {
        return next(err);
    } finally {
        if(resdata) {
            if(req.query.format == `csv`) {
                const parser = new Parser(Object.keys(resdata));

                res.type(`text/csv`);
                res.send(parser.parse(resdata));
            } else {
                res.status(200).json(resdata);
            }
        } else res.status(204).send();

        if(conn) conn.end();
    }
};

/*
    Endpoint Implementation
    Resource URL: /stats
    Supported Methods: GET

    Returns general usage statistics
*/
exports.stats = async (req, res, next) => {
    let conn, resdata;

    try {
        conn = await pool.getConnection();

        const questionnaire_count = Number((await conn.query(`SELECT COUNT(*) FROM questionnaires;`))[0]["COUNT(*)"]);
        const keyword_count = Number((await conn.query(`SELECT COUNT(*) FROM keywords;`))[0]["COUNT(*)"]);
        const question_count = Number((await conn.query(`SELECT COUNT(*) FROM questions;`))[0]["COUNT(*)"]);
        const option_count = Number((await conn.query(`SELECT COUNT(*) FROM options;`))[0]["COUNT(*)"]);
        const answer_count = Number((await conn.query(`SELECT COUNT(*) FROM answers;`))[0]["COUNT(*)"]);
        const session_count = Number((await conn.query(`SELECT COUNT(*) FROM sessions;`))[0]["COUNT(*)"]);

        resdata = {
            status: "OK",
            counts: {
                questionnaires: questionnaire_count,
                keywords: keyword_count,
                questions: question_count,
                options: option_count,
                answers: answer_count,
                sessions: session_count
            },
        }
    } catch(err) {
        return next(err);
    } finally {
        if(resdata) {
            if(req.query.format == `csv`) {
                resdata.counts.status = resdata.status;
                
                const parser = new Parser(Object.keys(resdata.counts));

                res.type(`text/csv`);
                res.send(parser.parse(resdata.counts));
            } else {
                res.status(200).json(resdata);
            }
        } else res.status(204).send();

        if(conn) conn.end();
    }
};

/*
    Endpoint Implementation
    Resource URL: /question/:questionnaireID/:questionID
    Supported Methods: GET

    Returns the details and options of a question
*/
exports.question = async (req, res, next) => {
    const missingParameters = [];

    if(!req.params.questionnaireID) missingParameters.push(`questionnaireID`);
    if(!req.params.questionID) missingParameters.push(`questionID`);

    if(missingParameters.length > 0) {
        return next(new errors.UsageError(`Missing parameter` + (missingParameters.length > 1 ? `s` : ``) + `: ` + missingParameters.join(`, `), 400));
    }

    let conn, resdata;

    try {
        conn = await pool.getConnection();

        const question = (await conn.query(`SELECT * FROM questions WHERE questionnaireID = ? AND qID = ?;`, [req.params.questionnaireID, req.params.questionID]))[0];

        if(question) {
            const options = (await conn.query(`SELECT optID, opttxt, nextqID FROM options WHERE questionnaireID = ? AND qID = ? ORDER BY optID ASC;`, [req.params.questionnaireID, req.params.questionID]));

            resdata = question;
            resdata.options = options;
        }
    } catch(err) {
        return next(err);
    } finally {
        if(resdata) {
            if(req.query.format == `csv`) {
                for(option in resdata.options) {
                    resdata.options[option] = {...resdata, ...resdata.options[option]};
                    delete resdata.options[option].options;
                }

                const parser = new Parser(Object.keys(resdata.options));

                res.type(`text/csv`);
                res.send(parser.parse(resdata.options));
            } else {
                res.status(200).json(resdata);
            }
        } else res.status(204).send();

        if(conn) conn.end();
    }
};

/*
    Endpoint Implementation
    Resource URL: /doanswer/:questionnaireID/:questionID/:session/:optionID
    Supported Methods: POST

    Registers an option as the answer to a questionnaire's question during a specific session
*/
exports.doanswer = async (req, res, next) => {
    const missingParameters = [];

    if(!req.params.questionnaireID) missingParameters.push(`questionnaireID`);
    if(!req.params.questionID) missingParameters.push(`questionID`);
    if(!req.params.session) missingParameters.push(`session`);
    if(!req.params.optionID) missingParameters.push(`optionID`);

    if(missingParameters.length > 0) {
        return next(new errors.UsageError(`Missing parameter` + (missingParameters.length > 1 ? `s` : ``) + `: ` + missingParameters.join(`, `), 400));
    }

    let conn, resdata;

    try {
        conn = await pool.getConnection();

        await conn.query(`
            INSERT INTO answers
            (session, ans, questionnaireID, qID)
            VALUES (?, ?, ?, ?);`,
        [req.params.session, req.params.optionID, req.params.questionnaireID, req.params.questionID]);

        resdata = {
            status: "OK"
        };
    } catch(err) {
        return next(err);
    } finally {
        if(req.query.format == `csv`) {
            const parser = new Parser(Object.keys(resdata));

            res.type(`text/csv`);
            res.send(parser.parse(resdata));
        } else {
            res.status(200).json(resdata);
        }

        if(conn) conn.end();
    }
};

/*
    Endpoint Implementation
    Resource URL: /newsession/:questionnaireID
    Supported Methods: POST

    Create a new session for a specific questionnaire
*/
exports.newsession = async (req, res, next) => {
    if(!req.params.questionnaireID) {
        return next(new errors.UsageError(`Missing parameter: questionnaireID`, 400));
    }

    let conn, resdata;

    try {
        conn = await pool.getConnection();

        const lastSession = (await conn.query(`SELECT session FROM sessions ORDER BY date DESC LIMIT 1;`))[0];
        const nextSession = lastSession ? `S` + (parseInt(lastSession.session.substring(1)) + 1) : `S0`;

        const affectedRows = (await conn.query(`INSERT INTO sessions (session, questionnaireID) VALUES (?, ?)`, [nextSession, req.params.questionnaireID])).affectedRows;

        if(affectedRows == 1) {
            resdata = {
                status: "OK",
                questionnaireID: req.params.questionnaireID,
                session: nextSession
            }
        } else {
            resdata = {
                status: "failed",
                reason: "unknown"
            }
        }
    } catch(err) {
        return next(err);
    } finally {
        if(req.query.format == `csv`) {
            const parser = new Parser(Object.keys(resdata));

            res.type(`text/csv`);
            res.send(parser.parse(resdata));
        } else {
            res.status(200).json(resdata);
        }

        if(conn) conn.end();
    }
};

/*
    Endpoint Implementation
    Resource URL: /getsessionanswers/:questionnaireID/:session
    Supported Methods: GET

    Returns all answers given to the questions of a questionnaire during a session
*/
exports.getsessionanswers = async (req, res, next) => {
    const missingParameters = [];

    if(!req.params.questionnaireID) missingParameters.push(`questionnaireID`);
    if(!req.params.session) missingParameters.push(`session`);

    if(missingParameters.length > 0) {
        return next(new errors.UsageError(`Missing parameter` + (missingParameters.length > 1 ? `s` : ``) + `: ` + missingParameters.join(`, `), 400));
    }

    let conn, resdata;

    try {
        conn = await pool.getConnection();

        const answers = (await conn.query(`SELECT qID, ans FROM answers WHERE questionnaireID = ? AND session = ? ORDER BY qID ASC;`, [req.params.questionnaireID, req.params.session]));

        if(answers.length > 0) {
            resdata = {
                questionnaireID: req.params.questionnaireID,
                session: req.params.session,
                answers: answers
            }
        }
    } catch(err) {
        return next(err);
    } finally {
        if(resdata) {
            if(req.query.format == `csv`) {
                for(answer in resdata.answers) {
                    resdata.answers[answer] = {...resdata, ...resdata.answers[answer]};
                    delete resdata.answers[answer].answers;
                }

                const parser = new Parser(Object.keys(resdata.answers));

                res.type(`text/csv`);
                res.send(parser.parse(resdata.answers));
            } else {
                res.status(200).json(resdata);
            }
        } else res.status(204).send();

        if(conn) conn.end();
    }
};

/*
    Endpoint Implementation
    Resource URL: /getquestionanswers/:questionnaireID/:questionID
    Supported Methods: GET

    Returns all answers given to a specific question of a questionnaire over all sessions
*/
exports.getquestionanswers = async (req, res, next) => {
    const missingParameters = [];

    if(!req.params.questionnaireID) missingParameters.push(`questionnaireID`);
    if(!req.params.questionID) missingParameters.push(`questionID`);

    if(missingParameters.length > 0) {
        return next(new errors.UsageError(`Missing parameter` + (missingParameters.length > 1 ? `s` : ``) + `: ` + missingParameters.join(`, `), 400));
    }

    let conn, resdata;

    try {
        conn = await pool.getConnection();

        const answers = (await conn.query(`SELECT session, ans FROM answers WHERE questionnaireID = ? AND qID = ? ORDER BY session ASC;`, [req.params.questionnaireID, req.params.questionID]));

        if(answers.length > 0) {
            resdata = {
                questionnaireID: req.params.questionnaireID,
                questionID: req.params.questionID,
                answers: answers
            }
        }
    } catch(err) {
        return next(err);
    } finally {
        if(resdata) {
            if(req.query.format == `csv`) {
                for(answer in resdata.answers) {
                    resdata.answers[answer] = {...resdata, ...resdata.answers[answer]};
                    delete resdata.answers[answer].answers;
                }

                const parser = new Parser(Object.keys(resdata.answers));

                res.type(`text/csv`);
                res.send(parser.parse(resdata.answers));
            } else {
                res.status(200).json(resdata);
            }
        } else res.status(204).send();

        if(conn) conn.end();
    }
};
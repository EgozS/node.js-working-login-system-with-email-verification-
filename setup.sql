create database copilot;
use copilot;
CREATE TABLE accounts (
    `Id` varchar(255),
    `token` varchar(255),
    `Username` varchar(255),
    `Password` varchar(255),
    `Email` varchar(255),
    `verify` boolean not null default false
);

SELECT * FROM accounts;
drop table accounts;
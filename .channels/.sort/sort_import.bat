@echo off

set data_in=%~dp0.\data\import.in
set data_out=%~dp0.\data\import.out

set divider=\x3e
set column_index=3

perl "%~dp0.\sort.pl" "%divider%" "%column_index%" "%data_in%" >"%data_out%"

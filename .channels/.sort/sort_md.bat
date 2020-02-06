@echo off

set data_in=%~dp0.\data\md.in
set data_out=%~dp0.\data\md.out

set divider=\x5b
set column_index=2

perl "%~dp0.\sort.pl" "%divider%" "%column_index%" "%data_in%" >"%data_out%"

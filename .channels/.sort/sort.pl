# https://www.perlmonks.org/?node_id=773475
# https://perlmaven.com/sorting-arrays-in-perl

die("wrong number of input parameters") unless ($#ARGV + 1 == 3);

my $divider      = $ARGV[0];
my $column_index = $ARGV[1];
my $input_file   = $ARGV[2];

my $regex = qr|$divider|;
my @lines;

open(FH, '<', $input_file) or die $!;
while (<FH>) {
  chomp;
  push @lines, [ $_, split $regex ];
}
close(FH);

@lines = sort { lc($a->[$column_index]) cmp lc($b->[$column_index]) } @lines;

for (@lines) {
  print "$_->[0]\n";
}

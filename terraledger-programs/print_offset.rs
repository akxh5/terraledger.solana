
use squads_multisig_program::state::Multisig;
fn main() {
    println!("Multisig size: {}", std::mem::size_of::<Multisig>());
}

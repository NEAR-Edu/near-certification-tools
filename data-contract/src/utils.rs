use crate::*;

pub fn assert_nonzero_deposit() {
    require!(env::attached_deposit() > 0, "Non-zero deposit required");
}

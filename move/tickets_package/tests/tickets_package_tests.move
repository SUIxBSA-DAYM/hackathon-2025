/*#[test_only]
module tickets_package::tickets_package_tests;
// uncomment this line to import the module
// use tickets_package::tickets_package;

const ENotImplemented: u64 = 0;

#[test]
fun test_tickets_package() {
    // pass
}

#[test, expected_failure(abort_code = ::tickets_package::tickets_package_tests::ENotImplemented)]
fun test_tickets_package_fail() {
    abort ENotImplemented
}
*/

#[test_only]
module tickets_package::tickets_package_tests {
    use std::debug;
    // uncomment this line to import the module
    use tickets_package::tickets_package::{create_event, create_place, buy_ticket};
    use sui::test_scenario;
    use std::string;
    use tickets_package::user::create_organizer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;

    /**/
    #[test]
    fun test_create_event_success() {
        let owner = @0x1;
        let mut ts = test_scenario::begin(owner);
        let ctx = ts.ctx();
        let places = vector[string::utf8(b"Main Hall"), string::utf8(b"VIP Section")];
        let capacities = vector[2, 1];
        let prices = vector[2, 3];
        let mut organizer = create_organizer(string::utf8(b"test"), string::utf8(b"efin"), ctx); 
        let event = create_event(
            string::utf8(b"Dev Meetup"),
            string::utf8(b"37.7749,-122.4194"), // Example coordinates
            2317040600, // Example timestamp
            string::utf8(b"Tech"),
            places,
            prices,
            capacities,
            &mut organizer,
            ctx
        );
        assert!(event.name() == &string::utf8(b"Dev Meetup"), 1);
        assert!(event.total_capacity() == 3, 0);
        transfer::public_transfer(event, owner);
        transfer::public_transfer(organizer, owner);
        ts.end();
        // Optionally, check more properties...
    }
    #[test]
    #[expected_failure(abort_code = tickets_package::tickets_package::EPlaceNameCapacityLengthMismatch)]
    fun test_create_event_length_mismatch() {
        // Start the test scenario
        let owner = @0x1;
        let mut ts = test_scenario::begin(owner);
        let ctx = ts.ctx();

        // Define event details with mismatched vector lengths
        let places = vector[string::utf8(b"Zone 1")]; // Length 1
        let capacities = vector[10, 20];   // Length 2
        let prices = vector[4, 6];
        let mut organizer = create_organizer(string::utf8(b"test"), string::utf8(b"efin"), ctx); 

        // Execute the transaction
        let event = create_event(
            string::utf8(b"Mismatched Event"),
            string::utf8(b"0.0"),
            1617040600, // Example timestamp
            string::utf8(b"Test"),
            places,
            prices,
            capacities, // This mismatch should cause an abort
            &mut organizer,
            ctx
        );
        // This part of the code should not be reached. Clean up if it does.
        transfer::public_transfer(event, owner);
        transfer::public_transfer(organizer, owner);
        // End the scenario
        ts.end();
    }

    #[test]
    public fun test()  {
        let x = 42;
        debug::print(&x);

        let mut v = vector::empty();
        vector::push_back(&mut v, 100);
        vector::push_back(&mut v, 200);
        vector::push_back(&mut v, 300);
        debug::print(&v);
        debug::print_stack_trace();
    }

    #[test]
    fun test_buy_ticket_multiple() {
        let user = @0xCAFE;
        let mut scenario = test_scenario::begin(user);

        // Mint SUI coins for the user
        let coin = coin::mint_for_testing<SUI>(1000, scenario.ctx());
        transfer::public_transfer(coin, user);
        let mut organizer = create_organizer(string::utf8(b"test"), string::utf8(b"efin"), scenario.ctx());
        let mut event = create_event(
            string::utf8(b"Concert"),
            string::utf8(b"37.7749,-122.4194"), // Example coordinates
            2317040600, // Example timestamp
            string::utf8(b"Music"),
            vector[string::utf8(b"Main Hall"), string::utf8(b"VIP Section")],
            vector[2, 3],
            vector[2, 1],
            &mut organizer,
            scenario.ctx()
        );
        let place1 = create_place(string::utf8(b"Main Hall"), 2, 2);
        let place2 = create_place(string::utf8(b"VIP Section"), 3, 1);
        let clock = scenario.object_at<sui::clock::Clock>(@0x6);
        // Prepare event, place, clock, etc.
        // let mut event = ...;
        // let place = ...;
        // let clock = ...;

        // First transaction: user buys a ticket
        scenario.next_tx(user);
        {
            let mut payment_coin: Coin<SUI> = scenario.take_from_sender();
            buy_ticket(&mut payment_coin, user, &mut event, place1, clock, scenario.ctx());
            transfer::public_transfer(payment_coin, user); // Return remaining coin to user
        }

        // Second transaction: user buys another ticket
        scenario.next_tx(user);
        {
            let mut payment_coin: Coin<SUI> = scenario.take_from_sender();
            buy_ticket(&mut payment_coin, user, &mut event, place2, clock, scenario.ctx());
            transfer::public_transfer(payment_coin, user);
        }

        // ...repeat as needed

        // Now, list all UserNft objects owned by the user
        let user_nft_ids = ids_for_address<UserNft>(user);
        // You can assert on the length or contents of user_nft_ids here
        debug::print(&user_nft_ids);
        debug::print_stack_trace();
        scenario.end();
    }


}

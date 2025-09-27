/*
#[test_only]
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
/*
#[test_only]
module tickets_package::tickets_package_tests {

    // uncomment this line to import the module
    use tickets_package::tickets_package::create_event;
    use sui::test_scenario;
    use std::string;
    use tickets_package::user::create_organizer;

    #[test]
    fun test_create_event_success() {
        let owner = @0x1;
        let mut ts = test_scenario::begin(owner);
        let ctx = ts.ctx();
        let places = vector[string::utf8(b"Main Hall"), string::utf8(b"Side Room")];
        let capacities = vector[2, 1];
        let prices = vector[2, 3];
        let mut organizer = create_organizer(string::utf8(b"https//example.com"),  vector[@0, @1]: vector<address>, string::utf8(b"qenhrgdt"), ctx); 
        let event = create_event(
            string::utf8(b"Dev Meetup"),
            string::utf8(b"37.7749,-122.4194"), // Example coordinates
            string::utf8(b"2024-07-01T18:00:00Z"),
            string::utf8(b"Tech"),
            places,
            prices,
            capacities,
            &mut organizer,
            ctx
        );
        assert!(event.name() == &string::utf8(b"Dev Meetup"), 1);
        assert!(event.total_capacity() == 3, 0);
        ts.return_to_sender(event);
        ts.return_to_sender(organizer);
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
        let mut organizer = create_organizer(string::utf8(b"https://example.com"), ctx);

        // Execute the transaction
        let event = create_event(
            string::utf8(b"Mismatched Event"),
            string::utf8(b"0.0"),
            string::utf8(b"2025-12-01T12:00:00Z"),
            string::utf8(b"Test"),
            places,
            prices,
            capacities, // This mismatch should cause an abort
            &mut organizer,
            ctx
        );
        // This part of the code should not be reached. Clean up if it does.
        ts.return_to_sender(event);
        ts.return_to_sender(organizer);
        // End the scenario
        ts.end();
    }
}
*/
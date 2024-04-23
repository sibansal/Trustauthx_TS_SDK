import { _EdgeDBRoleQuery } from "../src/_EdgeDBRoleQuery";
import { AuthLiteClient } from "../src/index";
import { api_key, org_id, secret_key } from "./../jest.common";

const mockedInstances = [new AuthLiteClient(api_key, secret_key, org_id), new AuthLiteClient(api_key, secret_key)];

describe('_EdgeDBRoleQuery', () => {
    describe('reinitializeAll', () => {
        it('should call _reInitRoles on all AuthLiteClient instances when foreground is true', () => {
            const spy = jest.spyOn(AuthLiteClient.prototype, '_reInitRoles');
            const foreground = true;

            _EdgeDBRoleQuery.reinitializeAll(foreground);

            expect(spy).toHaveBeenCalledTimes(mockedInstances.length);
            spy.mockRestore();
        });

        it('should call _reInitRoles on all AuthLiteClient instances asynchronously when foreground is false', () => {
            const spy = jest.spyOn(AuthLiteClient.prototype, '_reInitRoles');
            const foreground = false;

            _EdgeDBRoleQuery.reinitializeAll(foreground);

            expect(spy).not.toHaveBeenCalled(); // The function should not be called synchronously
            setTimeout(() => {
                expect(spy).toHaveBeenCalledTimes(mockedInstances.length);
                spy.mockRestore(); // Restore the original function
            }, 0);
        });
    });

    describe('EDGEWrapper', () => {
        it('should call reinitializeAll when X-EDGE header does not match totalRoles', () => {
            const mockedFunc = jest.fn();
            const mockedResponse = { headers: { get: jest.fn().mockReturnValue('3') } }; // Simulating X-EDGE header
            const mockedTotalRoles = 5;
            _EdgeDBRoleQuery.totalRoles = mockedTotalRoles;

            const wrappedFunc = _EdgeDBRoleQuery.EDGEWrapper(mockedFunc);
            wrappedFunc(mockedResponse);

            expect(mockedFunc).toHaveBeenCalledWith(mockedResponse);
            expect(_EdgeDBRoleQuery.reinitializeAll).toHaveBeenCalled();
        });

        it('should not call reinitializeAll when X-EDGE header matches totalRoles', () => {
            // Arrange
            const mockedFunc = jest.fn();
            const mockedResponse = { headers: { get: jest.fn().mockReturnValue('5') } }; // Simulating X-EDGE header
            const mockedTotalRoles = 5;
            _EdgeDBRoleQuery.totalRoles = mockedTotalRoles;

            // Act
            const wrappedFunc = _EdgeDBRoleQuery.EDGEWrapper(mockedFunc);
            wrappedFunc(mockedResponse);

            // Assert
            expect(mockedFunc).toHaveBeenCalledWith(mockedResponse);
            expect(_EdgeDBRoleQuery.reinitializeAll).not.toHaveBeenCalled();
        });
    });
});

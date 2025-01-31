import { ComponentsComponent } from './components.component';
import { ExternalComponent } from '../../../../common/application/external-component';

describe('ComponentsComponent', () => {
    let component: ComponentsComponent;

    beforeEach(() => {
        component = new ComponentsComponent();
    });

    describe('constructor', () => {
        it('should create', () => {
            // Arrange

            // Act

            // Assert
            expect(component).toBeDefined();
        });
    });

    describe('externalComponents', () => {
        it('should return a list of external components', () => {
            // Arrange

            // Act
            const externalComponents: ExternalComponent[] = component.externalComponents;

            // Assert
            expect(externalComponents.length).toBeGreaterThan(0);
        });
    });
});

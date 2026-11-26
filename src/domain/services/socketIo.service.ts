export interface SocketIoService {
    emit(event: string, payload: any): void;
    to(room: string): SocketIoService;

}
